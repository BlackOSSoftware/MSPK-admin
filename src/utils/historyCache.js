// Simple In-Memory Cache for Chart History
// Keys: "SYMBOL_TIMEFRAME" -> Value: { data: [], volData: [], timestamp: Date.now() }

const CACHE_LIMIT = 50;
const cache = new Map();

/**
 * Get cached history if valid
 * @param {string} key - SYMBOL_TIMEFRAME
 * @param {number} validitySeconds - How long data is fresh (default 60s)
 */
export const getCachedHistory = (key, validitySeconds = 60) => {
    if (!cache.has(key)) return null;
    
    const entry = cache.get(key);
    const age = (Date.now() - entry.timestamp) / 1000;
    
    if (age > validitySeconds) {
        cache.delete(key);
        return null;
    }
    
    return entry;
};

/**
 * Set history to cache
 */
export const setCachedHistory = (key, data, volData) => {
    // Evict oldest if limit reached
    if (cache.size >= CACHE_LIMIT) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    
    cache.set(key, {
        data,
        volData,
        timestamp: Date.now()
    });
};

/**
 * Clear cache
 */
export const clearHistoryCache = () => {
    cache.clear();
};
