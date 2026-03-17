/* eslint-disable no-restricted-globals */

// Simple worker to fetch data in background
const API_BASE = '/api';

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === 'PREFETCH') {
        const { symbols, timeframe, token, count = 500 } = payload;
        
        // Process in Concurrency Batches (e.g., 3 at a time)
        const BATCH_SIZE = 3;
        for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
            const batch = symbols.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (symbol) => {
                try {
                    const end = Math.floor(Date.now() / 1000);
                    const url = `${self.location.origin}/api/market/history?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(timeframe)}&to=${end}&count=${count}`;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const response = await fetch(url, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        // Handle wrapped data format
                        const rawData = Array.isArray(data) ? data : (data.data || []);
                        
                        if (Array.isArray(rawData) && rawData.length > 0) {
                            self.postMessage({
                                type: 'PREFETCH_SUCCESS',
                                payload: { symbol, timeframe, count, data: rawData }
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
