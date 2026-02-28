/**
 * Intelligent Indicator Cache
 * Memoizes expensive calculations to avoid redundant processing.
 */

class IndicatorCache {
    constructor(limit = 1000) {
        this.memoryCache = new Map();
        this.limit = limit;
        this.hitCount = 0;
        this.missCount = 0;
        
        // Optional: Session Storage Restoration
        this._loadFromSession();
        
        // Auto-cleanup interval (5 mins)
        setInterval(() => this.prune(), 5 * 60 * 1000);
    }

    /**
     * Generate a unique key for the calculation request
     */
    generateKey(indicatorId, data, params) {
        if (!data || data.length === 0) return null;
        
        // We utilize the last candle's time and data length as versioning
        // This is much faster than hashing the entire dataset
        const lastCandle = data[data.length - 1];
        const lastTime = lastCandle ? lastCandle.time : 0;
        const lastClose = lastCandle ? lastCandle.close : 0;
        const version = `${data.length}_${lastTime}_${lastClose}`;
        
        // Params string
        const paramStr = JSON.stringify(params); // Fast enough for small config objects
        
        return `${indicatorId}|${paramStr}|${version}`;
    }

    get(key) {
        if (!key) return null;
        
        if (this.memoryCache.has(key)) {
            const entry = this.memoryCache.get(key);
            entry.lastAccessed = Date.now(); // Update LRU
            this.hitCount++;
            return entry.value;
        }
        
        this.missCount++;
        return null;
    }

    set(key, value) {
        if (!key) return;

        // Eviction if limit reached
        if (this.memoryCache.size >= this.limit) {
            this.evict();
        }

        this.memoryCache.set(key, {
            value,
            lastAccessed: Date.now(),
            timestamp: Date.now()
        });
        
        // Debounced Session Save (Optional, maybe heavy)
        // this._saveToSession(); 
    }

    evict() {
        // Simple LRU: Delete oldest
        // For standard Map, iteration is insertion order. 
        // We want Access Order.
        // We can find oldest access time.
        
        // Optimization: Just delete the first key in Map (FIFO) usually works well enough if we re-insert on access.
        // But here we didn't re-insert on get, we just updated property.
        // So let's iterate.
        
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, entry] of this.memoryCache) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
        }
    }

    prune() {
        const now = Date.now();
        const TTL = 5 * 60 * 1000; // 5 Minutes TTL for indicators
        
        for (const [key, entry] of this.memoryCache) {
            if (now - entry.timestamp > TTL) {
                this.memoryCache.delete(key);
            }
        }
    }

    _loadFromSession() {
        try {
            const raw = sessionStorage.getItem('MspkIndicatorCache');
            if (raw) {
                const parsed = JSON.parse(raw);
                parsed.forEach(([k, v]) => this.memoryCache.set(k, v));
            }
        } catch (e) {
            console.warn('Cache Load Failed', e);
        }
    }

    getStats() {
        return {
            hits: this.hitCount,
            misses: this.missCount,
            size: this.memoryCache.size,
            hitRate: this.getHitRate()
        };
    }

    getHitRate() {
        const total = this.hitCount + this.missCount;
        return total === 0 ? 0 : this.hitCount / total;
    }
}

export const indicatorCache = new IndicatorCache();
export default indicatorCache;
