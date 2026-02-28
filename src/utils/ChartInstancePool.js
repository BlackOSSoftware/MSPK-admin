import chartCache from './ChartDataCache';
import { WorkerPool } from './WorkerPool.js';
import IndicatorWorker from '../workers/indicator.worker?worker';

// Setup shared worker pool for the App (could be moved to a context, but module scope works)
const workerPool = new WorkerPool(() => new IndicatorWorker());

class ChartInstancePool {
    constructor() {
        this.pool = new Map(); // symbol -> { candles, indicators, timestamp }
        this.maxSize = 10;
        this.activeSymbol = null;
        this.standardIndicators = [
             { type: 'SUPERTREND', period: 10, multiplier: 3 },
             { type: 'RSI', period: 14 },
             { type: 'EMA', period: 20 },
             { type: 'HEIKIN_ASHI' } 
        ];
    }

    // Accessor
    getChart(symbol) {
        this.activeSymbol = symbol;
        if (this.pool.has(symbol)) {
            const entry = this.pool.get(symbol);
            entry.lastAccess = Date.now();
            return entry;
        }
        return null; // Cache Miss
    }

    // Called by Layout to warm up specific symbols
    async preWarm(symbols) {
        // Priority: Current Active -> Next -> Previous -> Others
        const targets = symbols.slice(0, this.maxSize);
        
        for (const sym of targets) {
            if (!this.pool.has(sym)) {
                this.loadAndCalc(sym);
            }
        }
        
        this.evict();
    }
    
    // Background warmer
    async backgroundWarm(nextSymbols) {
        // Lower priority
        // We can use requestIdleCallback if available, or just async
        if (typeof requestIdleCallback !== 'undefined') {
             requestIdleCallback(() => this.preWarm(nextSymbols));
        } else {
             setTimeout(() => this.preWarm(nextSymbols), 1000);
        }
    }

    async loadAndCalc(symbol) {
        try {
            // 1. Get Candles (RAM/Disk)
            const candles = await chartCache.getCandles(symbol, '5'); // Default 5m prewarm?
            if (!candles || candles.length === 0) return;

            // 2. Calc Indicators (Worker)
            const indicators = {};
            
            // Parallelize
            const promises = this.standardIndicators.map(ind => 
                workerPool.execute(ind.type, candles, ind)
                    .then(res => ({ key: ind.type, val: res }))
            );
            
            const results = await Promise.all(promises);
            results.forEach(r => indicators[r.key] = r.val);

            // 3. Store
            this.pool.set(symbol, {
                symbol,
                candles,
                indicators,
                timestamp: Date.now(),
                lastAccess: Date.now()
            });

            console.log(`[Pool] Warmed: ${symbol}`);
            
        } catch (e) {
            console.error(`[Pool] Failed to warm ${symbol}`, e);
        }
    }

    evict() {
        if (this.pool.size <= this.maxSize) return;
        
        // LRU Eviction
        let oldest = null;
        let oldestTime = Infinity;
        
        for (const [sym, entry] of this.pool.entries()) {
            if (sym === this.activeSymbol) continue; // Don't evict active
            if (entry.lastAccess < oldestTime) {
                oldestTime = entry.lastAccess;
                oldest = sym;
            }
        }
        
        if (oldest) {
            this.pool.delete(oldest);
        }
    }
    
    // Called when a tick arrives for a background symbol
    updateSymbol(symbol, tick) {
        if (this.pool.has(symbol)) {
            const entry = this.pool.get(symbol);
            // Append tick logic (simple)
            // In reality, we must update last candle or push new. 
            // For now, invalidate or re-fetch? 
            // Better: "Dirty" flag, re-calc on switch.
            entry.isDirty = true;
        }
    }
}

export const instancePool = new ChartInstancePool();
export default instancePool;
