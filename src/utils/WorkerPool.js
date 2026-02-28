export class WorkerPool {
    constructor(workerFactory, poolSize = 4) {
        console.log('[WorkerPool] Initializing v1.6 (With Error Handling)...');
        this.workerFactory = workerFactory;
        this.poolSize = poolSize;
        this.workers = [];
        this.queue = [];
        this.activeTasks = new Map(); // workerIndex -> taskId
        this.taskMap = new Map(); // taskId -> { resolve, reject }
        this.nextTaskId = 1;
        
        this._init();
    }

    _init() {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = this.workerFactory();
            worker.onmessage = (e) => this._handleMessage(i, e.data);
            worker.onerror = (e) => this._handleError(i, e);
            this.workers.push({ worker, busy: false, id: i });
        }
    }

    execute(type, data, config = {}, transferList = []) {
        return new Promise((resolve, reject) => {
            const taskId = this.nextTaskId++;
            this.taskMap.set(taskId, { resolve, reject, type });

            const task = { taskId, type, data, config, transferList };
            this._schedule(task);
        });
    }

    _schedule(task) {
        const worker = this.workers.find(w => !w.busy);
        if (worker) {
            this._runWorker(worker, task);
        } else {
            this.queue.push(task);
        }
    }

    _runWorker(worker, task) {
        worker.busy = true;
        this.activeTasks.set(worker.id, task.taskId);
        
        const message = {
            id: task.taskId,
            type: task.type,
            data: task.data,
            config: task.config
        };
        
        worker.worker.postMessage(message, task.transferList);
    }

    _handleMessage(workerId, msg) {
        const { id, result, success, error } = msg;
        const taskDef = this.taskMap.get(id);
        
        if (taskDef) {
            if (success) taskDef.resolve(result);
            else taskDef.reject(new Error(error));
            this.taskMap.delete(id);
        }

        this.activeTasks.delete(workerId);
        const worker = this.workers[workerId];
        worker.busy = false;

        if (this.queue.length > 0) {
            const nextTask = this.queue.shift();
            this._runWorker(worker, nextTask);
        }
    }

    _handleError(workerId, error) {
        // Prevent infinite recursion if the factory itself or the error handler fails
        if (this.isShuttingDown) return;

        console.error(`[WorkerPool] Worker ${workerId} CRASHED:`, error);
        if (error && error.message) console.error(`Error Message: ${error.message}`);
        if (error && error.filename) console.error(`Source: ${error.filename}:${error.lineno}`);
        if (error && error.error) console.error(`Inner Error:`, error.error);
        
        const taskId = this.activeTasks.get(workerId);
        if (taskId) {
            const taskDef = this.taskMap.get(taskId);
            if (taskDef) {
                taskDef.reject(error);
                this.taskMap.delete(taskId);
            }
            this.activeTasks.delete(workerId);
        }
        
        // RECOVERY: Terminate and restart with a safety delay and retry limit
        const workerEntry = this.workers[workerId];
        if (!workerEntry) return;

        try {
            workerEntry.worker.terminate();
        } catch (e) {}

        // Add retry counter to the worker entry
        workerEntry.retries = (workerEntry.retries || 0) + 1;
        
        if (workerEntry.retries > 5) {
            console.error(`[WorkerPool] Worker ${workerId} exceeded retry limit. Disabling worker.`);
            workerEntry.busy = true; // Mark as permanently busy to stop scheduling
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, workerEntry.retries), 10000);
        console.log(`[WorkerPool] Restarting Worker ${workerId} in ${delay}ms (Attempt ${workerEntry.retries})...`);
        
        setTimeout(() => {
            try {
                const newWorker = this.workerFactory();
                newWorker.onmessage = (e) => this._handleMessage(workerId, e.data);
                newWorker.onerror = (e) => this._handleError(workerId, e);
                
                this.workers[workerId] = { 
                    worker: newWorker, 
                    busy: false, 
                    id: workerId, 
                    retries: workerEntry.retries 
                };
                
                // Process queue if any
                if (this.queue.length > 0) {
                    const nextTask = this.queue.shift();
                    this._runWorker(this.workers[workerId], nextTask);
                }
            } catch (factoryError) {
                console.error(`[WorkerPool] Failed to recreate worker ${workerId}:`, factoryError);
            }
        }, delay);
    }
}
