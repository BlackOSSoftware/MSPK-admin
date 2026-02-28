class MonitoringService {
    constructor() {
        this.metrics = {
            fps: [],
            latency: [],
            memory: [],
            wsMessages: 0,
            errors: 0
        };
        
        this.settings = {
            maxHistory: 60, // Keep last 60 seconds/minutes
            fpsAlert: 20,
            latencyAlert: 200 // ms
        };
        
        this.listeners = new Set();
        this.init();
    }

    init() {
        if (typeof window === 'undefined') return;

        // FPS Monitor
        let lastTime = performance.now();
        let frames = 0;
        
        const loop = () => {
            frames++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                this.record('fps', frames);
                frames = 0;
                lastTime = now;
                
                // Also snapshot memory every second
                this.snapshotMemory();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        // Error Listener
        window.addEventListener('error', () => {
            this.metrics.errors++;
            this.notify();
        });
        
        window.addEventListener('unhandledrejection', () => {
            this.metrics.errors++;
            this.notify();
        });
    }

    snapshotMemory() {
        if (performance.memory) {
            // Chrome API
            const mb = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            this.record('memory', mb);
        }
    }

    record(key, value) {
        if (!this.metrics[key]) this.metrics[key] = [];
        
        const arr = this.metrics[key];
        arr.push({ time: Date.now(), value });
        
        if (arr.length > this.settings.maxHistory) {
            arr.shift();
        }
        
        this.notify();
    }

    increment(key) {
        if (typeof this.metrics[key] === 'number') {
            this.metrics[key]++;
            this.notify();
        }
    }

    resetCount(key) {
        if (typeof this.metrics[key] === 'number') {
            this.metrics[key] = 0;
            this.notify();
        }
    }

    subscribe(cb) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.metrics));
    }

    getReport() {
        return {
            avgFps: this.getAverage('fps'),
            avgLatency: this.getAverage('latency'),
            peakMemory: this.getPeak('memory'),
            totalErrors: this.metrics.errors
        };
    }

    getAverage(key) {
        const arr = this.metrics[key];
        if (!arr || arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b.value, 0);
        return Math.round(sum / arr.length);
    }

    getPeak(key) {
        const arr = this.metrics[key];
        if (!arr || arr.length === 0) return 0;
        return Math.max(...arr.map(i => i.value));
    }
}

export const monitor = new MonitoringService();
export default monitor;
