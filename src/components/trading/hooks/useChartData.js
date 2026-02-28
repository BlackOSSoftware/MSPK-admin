import { useRef, useEffect, useState } from 'react';
import client from '../../../api/client';
import { calculateHeikenAshi } from '../../../utils/chartUtils';
import { getCachedHistory, setCachedHistory } from '../../../utils/historyCache';

export const useChartData = ({ symbol, timeframe, chartType, chartRef, seriesRef, volSeriesRef }) => {
    const currentSymbolRef = useRef(null);
    const toTimeRef = useRef(null);
    const allHistoryRef = useRef([]);
    const allVolHistoryRef = useRef([]);
    const loadingRef = useRef(false);
    const scrollListenerRef = useRef(null);
    
    // Track initialization state
    const isHistoryLoaded = useRef(false);
    
    // Track last candle strictly for updates
    const lastCandleRef = useRef(null);
    const lastHeikenRef = useRef(null);

    // Track data changes for indicators
    const [dataVersion, setDataVersion] = useState(0);
    const [isLoading, setIsLoading] = useState(true); // Expose loading state for UI

    // Keep active data ref for indicators
    const currentDataRef = useRef([]);

    // Track RAW candle for HA calculations
    const currentRawCandleRef = useRef(null);

    // Legend initial state setter/callback could be passed in, 
    // but for now we won't handle UI state here, just data refs.

    useEffect(() => {
        if (!symbol || !symbol.symbol) return;
        if (!chartRef.current || !seriesRef.current) return;

        // Abort Controller for cancelling stale requests
        const controller = new AbortController();
        const signal = controller.signal;

        currentSymbolRef.current = symbol.symbol; // Ensure this is up to date

        // Reset Logic - Only reset if we don't have immediate cache
        // But for safety, we usually reset refs. 
        // We will do a smart clean below.

        // Cache Key
        const cacheKey = `${symbol.symbol}_${timeframe}`;

        // --- INSTANT LOAD CHECK ---
        // Import cache synchronously if possible or assume available globally 
        // (importing inside useEffect is async, so we depend on module singleton)
        
        const load = async (toTime = null, isScroll = false) => {
            // Block scrolling if already loading, but allow INITIAL load to override
            if (loadingRef.current && isScroll) return;
            
            // Check Synch Cache Reference (Modules are cached)
            // We use the imported 'chartCache' from earlier context or import it
            const { default: chartCache } = await import('../../../utils/ChartDataCache');
            
            // 1. Sync Check (Memory)
            if (!isScroll && !toTime) {
                const memData = chartCache.getCandlesSync(symbol.symbol, timeframe);
                if (memData) {
                    // INSTANT HIT!
                    console.log(`[CHART_INSTANT] Memory Hit for ${cacheKey}`);
                    // Ensure refs are cleared from previous symbol if needed
                    if (allHistoryRef.current[0] && allHistoryRef.current[0].symbol !== symbol.symbol) {
                         // Soft reset
                         allHistoryRef.current = [];
                    }
                    
                    // Apply immediately
                    const { finalData, volData, rawData } = processRawData(memData, timeframe, chartType);
                    applyData(finalData, volData, false, rawData);
                    
                    // Skip loading state entirely
                    loadingRef.current = false;
                    setIsLoading(false);
                    return; 
                }
            }
            
            // 2. Normal Async Path
            loadingRef.current = true;
            if (!isScroll) setIsLoading(true); // Show loader for initial load (Cache Miss)

            // Reset Data if completely new (and no cache hit above)
            if (!isScroll && seriesRef.current) {
                 seriesRef.current.setData([]);
                 if (volSeriesRef.current) volSeriesRef.current.setData([]);
                 allHistoryRef.current = [];
                 allVolHistoryRef.current = [];
            }

            try {
                // Determine fetch properties
                const now = Math.floor(Date.now() / 1000);
                const end = toTime || Math.floor(now / 30) * 30;
                
                // CHECK CACHE (Only for initial load, not scroll)
                if (!isScroll) {
                    const cached = getCachedHistory(cacheKey);
                    if (cached) {
                        console.log(`[CHART_CACHE] Hit for ${cacheKey}`);
                        applyData(cached.data, cached.volData, false);
                        loadingRef.current = false;
                        setIsLoading(false);
                        return;
                    }
                }

                // Determine fetch size
                // Stage 1: MINIMAL Load (Very fast TTI)
                // Stage 2: FULL Load (Background fill)
                
                let baseDays = 10;
                if (timeframe === '1') baseDays = 0.5;
                else if (timeframe === '3') baseDays = 2;
                else if (timeframe === '5') baseDays = 4;
                else if (timeframe === '15') baseDays = 7;
                else if (timeframe === '30') baseDays = 15;
                else if (timeframe === '60') baseDays = 30;
                else if (timeframe === 'D') baseDays = 365;

                // For initial load, we do a very small fetch first
                const minimalDays = isScroll ? (baseDays * 10) : (baseDays / 5);
                const startMinimal = end - (minimalDays * 24 * 60 * 60);

                // USE CENTRAL CACHE MANAGER
                const { default: chartCache } = await import('../../../utils/ChartDataCache');
                
                let data = [];
                if (!isScroll) {
                    try {
                        data = await chartCache.getCandles(symbol.symbol, timeframe, startMinimal, end);
                    } catch (e) {
                        console.error("Cache Fetch Failed", e);
                    }
                } else {
                    const res = await client.get('/market/history', {
                        params: { symbol: symbol.symbol, resolution: timeframe, from: startMinimal, to: end },
                        signal
                    });
                    if (res.data) {
                        let rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
                        if (Array.isArray(rawData)) {
                            data = rawData.map(d => ({
                                time: d.time, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume || 0
                            }));
                        }
                    }
                }

                if (signal.aborted) return;

                if (symbol.symbol !== currentSymbolRef.current) return;

                if (Array.isArray(data) && data.length > 0) {
                    const { finalData, volData, rawData } = processRawData(data, timeframe, chartType);
                    if (signal.aborted) return;
                    applyData(finalData, volData, isScroll, rawData);
                    
                    // --- STAGE 2: Background Fill (Only if initial load and not scroll) ---
                    if (!isScroll && data.length > 0) {
                        setTimeout(async () => {
                            if (signal.aborted) return;
                            const startFull = end - (baseDays * 24 * 60 * 60);
                            try {
                                const fullData = await chartCache.getCandles(symbol.symbol, timeframe, startFull, end);
                                if (signal.aborted || symbol.symbol !== currentSymbolRef.current) return;
                                if (fullData && fullData.length > data.length) {
                                    const { finalData: fData, volData: vData, rawData: rData } = processRawData(fullData, timeframe, chartType);
                                    applyData(fData, vData, false, rData);
                                    console.log(`[CHART_LOAD] Background Stage 2 Complete for ${symbol.symbol}`);
                                }
                            } catch (e) { console.warn("Background load failed", e); }
                        }, 500); // Small delay to let UI breathe
                    }
                } else if (Array.isArray(data) && data.length === 0 && !isScroll) {
                    if (seriesRef.current) seriesRef.current.setData([]);
                    if (volSeriesRef.current) volSeriesRef.current.setData([]);
                    allHistoryRef.current = [];
                    allVolHistoryRef.current = [];
                }
            } catch (e) {
                if (e.name !== 'CanceledError' && e.message !== 'canceled') {
                    console.error("History fetch failed", e);
                }
            } finally {
                if (!signal.aborted) {
                    loadingRef.current = false;
                    if (!isScroll) setIsLoading(false);
                }
            }
        };

        // Helper: Process Raw Data (Aggregation + HA)
        const processRawData = (apiData, tf, type) => {
             let rawData = apiData
                .filter(d => d.close > 0)
                .map(d => ({
                    time: d.time,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                    volume: d.volume || 0
                }))
                .sort((a, b) => a.time - b.time);

            // Aggregation for 2h/4h if needed (matches previous logic)
            if (tf === '120' || tf === '240') {
                const aggMinutes = parseInt(tf);
                const aggSeconds = aggMinutes * 60;
                const aggregated = [];
                let currentCandle = null;

                rawData.forEach(candle => {
                    const bucketTime = candle.time - (candle.time % aggSeconds);
                    if (!currentCandle) {
                        currentCandle = { ...candle, time: bucketTime };
                    } else if (bucketTime === currentCandle.time) {
                        currentCandle.high = Math.max(currentCandle.high, candle.high);
                        currentCandle.low = Math.min(currentCandle.low, candle.low);
                        currentCandle.close = candle.close;
                        currentCandle.volume += candle.volume;
                    } else {
                        aggregated.push(currentCandle);
                        currentCandle = { ...candle, time: bucketTime };
                    }
                });
                if (currentCandle) aggregated.push(currentCandle);
                rawData = aggregated;
            }

            let finalData = rawData;
            if (type === 'heiken') {
                finalData = calculateHeikenAshi(rawData);
            }

            let volData = [];
            // Vol logic
             volData = apiData
                .filter(d => d.close > 0)
                .map(d => ({
                    time: d.time,
                    value: d.volume || 0,
                    color: d.close >= d.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                }))
                .sort((a, b) => a.time - b.time);

            return { finalData, volData, rawData };
        };

        // Helper: Apply Data to Chart
        const applyData = (data, volData, isScroll, rawDataForRef) => {
             if (isScroll) {
                // SCROLL LOAD: Prepend
                const currentData = allHistoryRef.current || [];
                const newData = [...data, ...currentData];
                
                // Dedupe
                const uniqueData = Array.from(new Map(newData.map(item => [item.time, item])).values()).sort((a, b) => a.time - b.time);
                
                if (seriesRef.current) seriesRef.current.setData(uniqueData);
                allHistoryRef.current = uniqueData;

                if (volSeriesRef.current) {
                    const currentVol = allVolHistoryRef.current || [];
                    const newVol = [...volData, ...currentVol];
                    const uniqueVol = Array.from(new Map(newVol.map(item => [item.time, item])).values()).sort((a, b) => a.time - b.time);
                    volSeriesRef.current.setData(uniqueVol);
                    allVolHistoryRef.current = uniqueVol;
                }

                currentDataRef.current = uniqueData;
                setDataVersion(v => v + 1);

            } else {
                // INITIAL LOAD: Set directly
                if (seriesRef.current) seriesRef.current.setData(data);
                allHistoryRef.current = data;
                currentDataRef.current = data;
                
                if (volSeriesRef.current) {
                    volSeriesRef.current.setData(volData);
                    allVolHistoryRef.current = volData;
                }

                // Set Refs
                const last = data[data.length - 1];
                lastCandleRef.current = last;
                if (chartType === 'heiken') {
                    lastHeikenRef.current = last;
                    
                    if (rawDataForRef) currentRawCandleRef.current = rawDataForRef[rawDataForRef.length - 1];
                } else {
                    currentRawCandleRef.current = last;
                }
                
                isHistoryLoaded.current = true;
                setDataVersion(v => v + 1);
            }
        };

        // Initial Load
        load();
        
        // Scroll Handler
        const handleScroll = (range) => {
            if (range && range.from < 5 && isHistoryLoaded.current) {
                if (!loadingRef.current) {
                    const firstTime = allHistoryRef.current?.[0]?.time;
                    if (firstTime) {
                        console.log(`[SCROLL_TRIGGER] Loading older for ${symbol.symbol} before ${firstTime}`);
                        // Fix: Load strictly OLDER than firstTime (API is inclusive of 'to', so we subtract 1s)
                        load(firstTime - 1, true); 
                    }
                }
            }
        };

        const timeScale = chartRef.current.timeScale();
        
        // Remove previous
        if (scrollListenerRef.current) {
            timeScale.unsubscribeVisibleLogicalRangeChange(scrollListenerRef.current);
        }

        // Subscribe new
        timeScale.subscribeVisibleLogicalRangeChange(handleScroll);
        scrollListenerRef.current = handleScroll;

        // Cleanup
        return () => {
            controller.abort();
            loadingRef.current = false;
            
            if (scrollListenerRef.current) {
                timeScale.unsubscribeVisibleLogicalRangeChange(scrollListenerRef.current);
                scrollListenerRef.current = null;
            }
        };

    }, [symbol?.symbol, timeframe, chartType]); // Reload on these changes

    return { 
        isHistoryLoaded, 
        lastCandleRef, 
        lastHeikenRef,
        currentRawCandleRef, 
        currentDataRef, 
        allHistoryRef,
        dataVersion, // Return version
        isLoading
    };
};
