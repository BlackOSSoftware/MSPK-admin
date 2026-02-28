import client from '../api/client';

const DB_NAME = 'MspkChartCache';
const STORE_NAME = 'candles';
const DB_VERSION = 1;

// --- IndexedDB Wrapper ---
const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME); // Key is generic string
        }
    };
});

const idb = {
    get: async (key) => {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },
    set: async (key, val) => {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(val, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },
    del: async (key) => {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
};

// --- Delta Compression Utils ---
// Format: [BaseTime, BaseOpen, [diffTime, diffOpen, diffHigh, diffLow, diffClose, vol], ... ]
const compressData = (data) => {
    if (!data || data.length === 0) return null;
    const base = data[0];
    const packed = [
        base.time,
        base.open,
        base.high - base.open,
        base.low - base.open,
        base.close - base.open,
        base.volume
    ]; // First candle fully relative to Open? No, keep it relative to itself.
    
    // Actually simpler: [time, open, high, low, close, volume]
    // Delta: [dTime, dOpen, dHigh, dLow, dClose, vol] relative to previous?
    // Let's stick to standard optimization: Store as simple struct, JSON stringify for IDB is fast enough.
    // If strict requirement is Delta:
    // We will do simple Int delta for Time and Float delta for Price relative to PREVIOUS CLOSE.
    
    // For specific requirement "Delta Compression":
    // Let's implement relative packing.
    // [startTime, startPrice, [dTime, dOpen, dHigh, dLow, dClose, Vol]...] 
    
    const deltas = [];
    let prevTime = base.time;
    let prevClose = base.close;
    
    data.slice(1).forEach(d => {
        deltas.push([
            d.time - prevTime,
            parseFloat((d.open - prevClose).toFixed(5)),
            parseFloat((d.high - d.open).toFixed(5)), // High relative to Open
            parseFloat((d.low - d.open).toFixed(5)),  // Low relative to Open
            parseFloat((d.close - d.open).toFixed(5)), // Close relative to Open
            d.volume
        ]);
        prevTime = d.time;
        prevClose = d.close;
    });

    return {
        base: { t: base.time, o: base.open, h: base.high, l: base.low, c: base.close, v: base.volume },
        d: deltas
    };
};

const decompressData = (packed) => {
    if (!packed || !packed.base) return [];
    
    const result = [{
        time: packed.base.t,
        open: packed.base.o,
        high: packed.base.h,
        low: packed.base.l,
        close: packed.base.c,
        volume: packed.base.v
    }];

    let prevTime = packed.base.t;
    let prevClose = packed.base.c;

    packed.d.forEach(d => {
        const [dt, do_diff, dh, dl, dc, vol] = d;
        const time = prevTime + dt;
        const open = prevClose + do_diff; // Open is relative to prev close
        
        // High/Low/Close stored relative to OPEN (common strategy)
        const high = open + dh;
        const low = open + dl;
        const close = open + dc;

        result.push({ time, open, high, low, close, volume: vol });
        
        prevTime = time;
        prevClose = close;
    });

    return result;
};


// --- Main Cache Class ---

class ChartDataCache {
    constructor() {
        this.memoryCache = new Map(); // LRU implemented via delete/set
        this.MAX_MEMORY_ITEMS = 50;
        this.MEMORY_TTL = 60 * 1000; // 60s (Increased for better UX)
        this.DISK_TTL = 10 * 60 * 1000; // 10m
        
        this.stats = { hits: 0, misses: 0, diskHits: 0, prefetch: 0 };
        
        // Initialize Worker
        this.worker = null;
        if (typeof window !== 'undefined' && window.Worker) {
            this.worker = new Worker(new URL('../workers/prefetch.worker.js', import.meta.url));
            this.worker.onmessage = this._handleWorkerMessage.bind(this);
        }
    }

    _addToMemory(key, data) {
        if (this.memoryCache.has(key)) {
            // Refresh LRU
            this.memoryCache.delete(key);
        } else if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
            // Evict oldest
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    async _saveToDisk(key, data) {
        try {
            // Async compression and save
            const packed = compressData(data);
            await idb.set(key, {
                packed,
                timestamp: Date.now()
            });
        } catch (e) {
            console.warn('IDB Write Failed', e);
        }
    }

    // --- Public Methods ---

    /**
     * Get Candles - Synchronous Memory Check Supported
     */
    getCandlesSync(symbol, timeframe) {
        const key = `${symbol}_${timeframe}`;
        if (this.memoryCache.has(key)) {
             const item = this.memoryCache.get(key);
             if (Date.now() - item.timestamp < this.MEMORY_TTL) {
                 this.stats.hits++;
                 return item.data;
             }
        }
        return null;
    }

    async getCandles(symbol, timeframe, from, to) {
        const key = `${symbol}_${timeframe}`; 
        
        // 1. Check Memory
        const memData = this.getCandlesSync(symbol, timeframe);
        if (memData) return memData;

        // 2. Check Disk
        try {
            const diskItem = await idb.get(key);
            if (diskItem) {
                if (Date.now() - diskItem.timestamp < this.DISK_TTL) {
                     const unpacked = decompressData(diskItem.packed);
                     this._addToMemory(key, unpacked); // Hydrate RAM
                     this.stats.diskHits++;
                     return unpacked;
                }
            }
        } catch (e) { /* ignore */ }

        // 3. Fetch API (Cache Miss)
        this.stats.misses++;
        try {
            const res = await client.get('/market/history', {
                params: { symbol, resolution: timeframe, from, to }
            });
            
            if (res.data) {
                // Handle wrapped data { data: [...] } vs direct array [...]
                let rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
                
                if (Array.isArray(rawData) && rawData.length > 0) {
                     const data = rawData.map(d => ({
                         time: d.time,
                         open: d.open,
                         high: d.high,
                         low: d.low,
                         close: d.close,
                         volume: d.volume || 0
                     })).sort((a,b) => a.time - b.time);

                     this._addToMemory(key, data);
                     this._saveToDisk(key, data); 
                     return data;
                }
            }
            return [];
        } catch (e) {
            console.error('API Fetch Error:', e);
            throw e;
        }
    }

    /**
     * Trigger background prefetch for multiple symbols
     */
    prefetch(currentSymbol, watchlist, timeframe) {
        if (!this.worker || !watchlist) return;

        // Find adjacent symbols (Next 5 + Prev 2)
        const idx = watchlist.findIndex(s => s.symbol === currentSymbol);
        if (idx === -1) return;

        const targets = [];
        const len = watchlist.length;
        
        // Add next 5
        for (let i = 1; i <= 5; i++) targets.push(watchlist[(idx + i) % len].symbol);
        // Add prev 2
        for (let i = 1; i <= 2; i++) targets.push(watchlist[(idx - i + len) % len].symbol);

        const uniqueTargets = [...new Set(targets)]; // Dedup

        // Send to worker
        const token = localStorage.getItem('mspk_token');
        
        this.worker.postMessage({
            type: 'PREFETCH',
            payload: {
                symbols: uniqueTargets,
                timeframe,
                token
            }
        });
    }

    /**
     * Single symbol prefetch (e.g. on Hover)
     */
    prefetchSingle(symbol, timeframe) {
        if (!this.worker || !symbol) return;
        
        // Check memory first - if exists, don't bother worker
        if (this.getCandlesSync(symbol, timeframe)) return;

        // Debounce/Throttling could be added here if hover is erratic, 
        // but worker handles it fine.
        const token = localStorage.getItem('mspk_token');
        this.worker.postMessage({
            type: 'PREFETCH',
            payload: {
                symbols: [symbol],
                timeframe,
                token
            }
        });
    }

    async _handleWorkerMessage(e) {
        const { type, payload } = e.data;
        if (type === 'PREFETCH_SUCCESS') {
            const { symbol, timeframe, data } = payload;
            const key = `${symbol}_${timeframe}`;
            const processed = data.map(d => ({
                 time: d.time,
                 open: d.open,
                 high: d.high,
                 low: d.low,
                 close: d.close,
                 volume: d.volume || 0
            })).sort((a,b) => a.time - b.time);
            
            // Save to memory (Low Priority - don't evict active user data if full)
            // Actually, we WANT this in memory for instant click
            this._addToMemory(key, processed);
            
            // Save to disk
            await this._saveToDisk(key, processed);
            this.stats.prefetch++;
        }
    }

    clear(symbol) {
         for (const key of this.memoryCache.keys()) {
             if (key.startsWith(symbol)) {
                 this.memoryCache.delete(key);
             }
         }
    }

    getStats() {
        return this.stats;
    }
}

export const chartCache = new ChartDataCache();
export default chartCache;
