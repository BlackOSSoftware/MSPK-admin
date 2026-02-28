import { WorkerPool } from '../WorkerPool';
import indicatorCache from './indicatorCache';
import IndicatorWorker from '../../workers/indicator.worker?worker';

class IndicatorService {
    constructor() {
        if (IndicatorService.instance) {
            return IndicatorService.instance;
        }
        console.log('[IndicatorService] Init with WorkerPool v1.6 (Vite Worker Mode)');
        this.pool = new WorkerPool(() => new IndicatorWorker(), 2); 
        IndicatorService.instance = this;
    }

    /**
     * Calculate Indicator (Async)
     * Checks Cache -> Worker -> Returns Result
     */
    async calculate(type, data, params) {
        // 1. Generate Cache Key
        const key = indicatorCache.generateKey(type, data, params);
        
        // 2. Check Cache
        const cached = indicatorCache.get(key);
        if (cached) {
            // console.debug(`[IndicatorService] Cache Hit: ${type}`);
            return cached;
        }

        // 3. Delegate to Worker
        try {
            // console.debug(`[IndicatorService] Computation: ${type}`);
            // We transfer nothing for now (Zero-copy requires ArrayBuffers, currently passing Objects)
            // Structured Clone logic applies automatically in postMessage.
            const result = await this.pool.execute(type, data, params);
            
            // 4. Cache Result
            if (result && key) {
                indicatorCache.set(key, result);
            }
            
            return result;
        } catch (e) {
            console.error(`[IndicatorService] Calculation Failed: ${type}`, e);
            return []; // Fallback empty
        }
    }
    
    getStats() {
        return indicatorCache.getStats();
    }
}

export const indicatorService = new IndicatorService();
export default indicatorService;
