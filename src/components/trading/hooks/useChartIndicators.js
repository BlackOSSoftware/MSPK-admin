import { useRef, useEffect } from 'react';
import indicatorService from '../../../utils/performance/IndicatorService';
// We still import simple sync utils for small tasks if needed, but mostly moving to service
import { calculateSMA, calculateEMA, calculateRSI, calculatePSAR, calculateHeikenAshi } from '../../../utils/chartUtils';

export const useChartIndicators = ({ chartRef, seriesRef, activeIndicators, currentDataRef, latestTick, chartType, isHistoryLoaded, dataVersion, onUpdateMarkers }) => {
    const resourcePoolRef = useRef(new Map());
    const historicalMarkersRef = useRef([]); 
    const prevResultsRef = useRef(new Map()); // Cache for Render-Diffing

    // Helper to create series
    const getSeriesFromPool = (res, index, color, width, chart) => {
        if (!res.pool[index]) {
            res.pool[index] = chart.addLineSeries({
                lineWidth: width,
                priceLineVisible: false,
                lastValueVisible: false,
                crosshairMarkerVisible: false,
                lineType: 2, // Simple Line (Matches Polygon Fill)
                lineVisible: true,
            });
        }
        res.pool[index].applyOptions({ color, visible: true });
        return res.pool[index];
    };

    // 1. Full Update / Re-calculation Logic
    useEffect(() => {
        if (!chartRef.current || !isHistoryLoaded.current) return;

        const data = currentDataRef.current;
        if (!data || data.length === 0) return;

        // Cleanup Inactive
        const activeIds = new Set(activeIndicators.map(i => i.uuid));
        resourcePoolRef.current.forEach((res, uuid) => {
            if (!activeIds.has(uuid)) {
                res.pool.forEach(s => chartRef.current.removeSeries(s));
                if (res.single) chartRef.current.removeSeries(res.single);
                if (res.cloud) chartRef.current.removeSeries(res.cloud);
                resourcePoolRef.current.delete(uuid);
                prevResultsRef.current.delete(uuid);
            }
        });

        // Async Calculation Runner
        const runCalculations = async () => {
            const startTime = performance.now();
            let newMarkers = [];
            
            // Parallel Execution
            const promises = activeIndicators.map(async (ind) => {
                let res = resourcePoolRef.current.get(ind.uuid);
                if (!res) {
                    res = { pool: [] };
                    resourcePoolRef.current.set(ind.uuid, res);
                }

                // Check Previous Cache
                const prevRes = prevResultsRef.current.get(ind.uuid);

                // --- ASYNC SIGNALS ---
                // Disabled: Moving to Backend Source of Truth to ensure 100% consistency across UI
                /*
                if (ind.id === 'Signals') {
                    const markers = await indicatorService.calculate('HybridSignals', data, { 
                        period: parseFloat(ind.period), 
                        multiplier: parseFloat(ind.multiplier) 
                    });
                    
                    // Diff Check
                    if (markers === prevRes) {
                        return { type: 'MARKERS', markers }; // Return markers for aggregation, but no render needed (markers handled globally)
                    }
                    prevResultsRef.current.set(ind.uuid, markers);
                    
                    return { type: 'MARKERS', markers };
                }
                */

                // --- ASYNC HHLL ---
                if (ind.id === 'HHLL') {
                    const result = await indicatorService.calculate('HHLL', data, {
                        period: parseInt(ind.period),
                        options: {
                            showLabels: ind.showLabels !== false, 
                            upColor: ind.upColor, 
                            downColor: ind.downColor 
                        }
                    });

                    if (result === prevRes) {
                        // Skip Chart Render! Fast!
                        return { type: 'MARKERS', markers: result?.markers || [] };
                    }
                    prevResultsRef.current.set(ind.uuid, result);
                    
                    const { markers, lineData } = result || { markers: [], lineData: [] };
                    
                    // Render Lines
                    let seriesIdx = 0;
                    if (lineData && lineData.length > 1) {
                         const startIdx = Math.max(0, lineData.length - 61);
                         for (let i = Math.max(1, startIdx); i < lineData.length; i++) {
                            const p1 = lineData[i - 1], p2 = lineData[i];
                            if (p1.time >= p2.time) continue;
                            const s = getSeriesFromPool(res, seriesIdx++, p2.value > p1.value ? (ind.upColor || '#10b981') : (ind.downColor || '#ef4444'), 3, chartRef.current);
                            s.setData([{ time: p1.time, value: p1.value }, { time: p2.time, value: p2.value }]);
                        }
                    }
                    for (let i = seriesIdx; i < res.pool.length; i++) res.pool[i].applyOptions({ visible: false });
                    
                    return { type: 'MARKERS', markers };
                }

                // --- ASYNC SUPERTREND ---
                if (ind.id === 'Supertrend') {
                    // CRITICAL: Strategy uses Heiken Ashi, so Visual must also use Heiken Ashi to match!
                    const haData = calculateHeikenAshi(data);
                    const stResult = await indicatorService.calculate('Supertrend', haData, {
                        period: parseInt(ind.period || 14),
                        multiplier: parseFloat(ind.multiplier || 1.5)
                    });
                    
                    if (stResult === prevRes) return null; // Skip
                    prevResultsRef.current.set(ind.uuid, stResult);

                    const { lineData, markers } = stResult || { lineData: [], markers: [] };

                    // Render Lines (Contiguous Segments)
                    if (lineData && lineData.length > 0) {
                        let seriesIdx = 0;
                        let currentSegment = [];
                        let currentTrend = null;

                        // Helper to flush segment
                        const flushSegment = (trend) => {
                            if (currentSegment.length < 1) return;
                            const color = trend === 1 ? '#10b981' : '#ef4444';
                            // TradingView Style: Bold Step Line -> Now Thinner
                            const s = getSeriesFromPool(res, seriesIdx++, color, 2, chartRef.current);
                            s.applyOptions({ lineType: 2, visible: true }); // LineType 2 (Curved) matches the new Bezier shading
                            // Ensure sorted unique time just in case, though source should be sorted
                            s.setData(currentSegment.map(d => ({ time: d.time, value: d.value })));
                            currentSegment = [];
                        };

                        for (let i = 0; i < lineData.length; i++) {
                            const d = lineData[i];
                            if (currentTrend === null) currentTrend = d.trend;

                            if (d.trend !== currentTrend) {
                                // Trend Flip -> Flush previous
                                flushSegment(currentTrend);
                                currentTrend = d.trend;
                                // Start new segment with this point
                                currentSegment.push(d);
                            } else {
                                currentSegment.push(d);
                            }
                        }
                        // Flush final
                        if (currentSegment.length > 0) flushSegment(currentTrend);

                        // Turn off unused series in pool
                        for (let i = seriesIdx; i < res.pool.length; i++) {
                             res.pool[i].applyOptions({ visible: false });
                        }

                        // Generate Cloud Data for Canvas Overlay (Gapless)
                        const priceMap = new Map();
                        if (data && data.length > 0) {
                             const len = data.length;
                             for(let i=0; i<len; i++) priceMap.set(data[i].time, data[i]);
                        }

                        const cloudData = [];
                        for (let i = 0; i < lineData.length; i++) {
                            const stPoint = lineData[i];
                            const candle = priceMap.get(stPoint.time);
                            if (!candle) continue;
                            
                            // Determine Range
                            let y1 = stPoint.value;
                            let y2 = stPoint.trend === 1 ? candle.low : candle.high;
                            
                            if (y1 === null || y1 === undefined || y2 === null || y2 === undefined) continue;

                            if (stPoint.trend === 1) {
                                // Up Trend (Green)
                                if (y1 > y2) y2 = y1; // Sanity
                            } else {
                                // Down Trend (Red)
                                if (y1 < y2) y2 = y1; 
                            }
                            
                            cloudData.push({ time: stPoint.time, y1, y2, color: stPoint.trend === 1 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)' });
                        }
                        
                        // Check if Strategy is Active
                        const isStrategyActive = activeIndicators.some(i => i.id === 'Signals');

                        // Return Cloud + Markers (Suppress markers if Strategy is active to avoid duplicates)
                        return { type: 'CLOUD', markers: isStrategyActive ? [] : (markers || []), cloud: cloudData };

                    } else {
                         // Return Empty Cloud if Line missing
                         return { type: 'CLOUD', markers: [], cloud: [] };
                    }
                }

                // --- SYNC STANDARD (Fast enough, but can still optimization diff) ---
                if (!res.single) {
                    res.single = chartRef.current.addLineSeries({ color: ind.color || '#2962FF', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
                } else { res.single.applyOptions({ color: ind.color, visible: true }); }

                // Standard indicators are usually fast enough, and 'res.single.update' is used for realtime.
                // But for full refresh... we calc entire array.
                // We should cache this too if we want "Zero Lag".
                // But simplified for Phase 1.
                
                if (ind.id === 'SMA') res.single.setData(calculateSMA(data, parseInt(ind.period)));
                else if (ind.id === 'EMA') res.single.setData(calculateEMA(data, parseInt(ind.period)));
                else if (ind.id === 'RSI') res.single.setData(calculateRSI(data, parseInt(ind.period)));
                else if (ind.id === 'PSAR') {
                    // Refined PSAR: Trend-based colors + Smaller spacing
                    const psarData = calculatePSAR(data);
                    const styledData = psarData.map(d => {
                         // Use calculated trend directly (O(1)) instead of searching array (O(N^2))
                         const isBullish = d.trend === 1; 
                         
                         return { 
                             time: d.time, 
                             value: d.value, 
                             color: isBullish ? '#10B981' : '#EF4444' 
                         };
                    });
                    
                    res.single.setData(styledData);
                    res.single.applyOptions({ 
                        lineWidth: 0, 
                        lineVisible: false, 
                        pointMarkersVisible: true, 
                        pointMarkersRadius: 2, // Smaller, sharper
                    });
                }
                
                return null;
            });

            const results = await Promise.all(promises);
            
            // Collect Output
            let combinedClouds = [];
            
            results.forEach(r => {
                if (r) {
                    if (r.markers) newMarkers = [...newMarkers, ...r.markers];
                    if (r.cloud) combinedClouds = [...combinedClouds, ...r.cloud];
                }
            });

            historicalMarkersRef.current = newMarkers;
            if (onUpdateMarkers) onUpdateMarkers({ markers: newMarkers, clouds: combinedClouds });
            
            // Record Duration for PerformanceMonitor
             window.lastCalcDuration = performance.now() - startTime;
        };

        runCalculations();

    }, [activeIndicators, chartType, isHistoryLoaded.current, dataVersion, latestTick]);

    return { indicatorResourcesRef: resourcePoolRef };
};
