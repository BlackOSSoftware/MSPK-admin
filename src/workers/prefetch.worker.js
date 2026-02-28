/* eslint-disable no-restricted-globals */

// Simple worker to fetch data in background
const API_BASE = '/api';

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === 'PREFETCH') {
        const { symbols, timeframe, token } = payload;
        
        // Process in Concurrency Batches (e.g., 3 at a time)
        const BATCH_SIZE = 3;
        for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
            const batch = symbols.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (symbol) => {
                try {
                    const end = Math.floor(Date.now() / 1000);
                    
                    // Smart Range Optimization: Fetch ~1000 candles for instant load
                    // This is smaller than full history but enough to fill the screen immediately.
                    let durationSeconds = 1000 * 60 * 60 * 24 * 2; // Default 2 days
                    
                    const tfNum = parseInt(timeframe);
                    if (!isNaN(tfNum)) {
                         // minutes * 1000 candles * 60s
                         // e.g. 5m * 1000 = 5000m = ~3.5 days
                         durationSeconds = tfNum * 1000 * 60; 
                    } else if (timeframe === 'D') {
                        // 1000 days
                        durationSeconds = 1000 * 24 * 60 * 60; 
                    } else if (timeframe === 'W') {
                        durationSeconds = 200 * 7 * 24 * 60 * 60; 
                    }

                    const start = end - durationSeconds;

                    const url = `${self.location.origin}/api/market/history?symbol=${symbol}&resolution=${timeframe}&from=${start}&to=${end}`;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const response = await fetch(url, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        // Handle wrapped data format
                        const rawData = Array.isArray(data) ? data : (data.data || []);
                        
                        if (Array.isArray(rawData) && rawData.length > 0) {
                            self.postMessage({
                                type: 'PREFETCH_SUCCESS',
                                payload: { symbol, timeframe, data: rawData }
                            });
                        }
                    }
                } catch (err) {
                    // Silent fail
                }
            }));
            
            // Yield briefly between batches to respect network
            if (i + BATCH_SIZE < symbols.length) await new Promise(r => setTimeout(r, 200));
        }
    }
};
