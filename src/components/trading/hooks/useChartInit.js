import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { getTradingViewConfig } from './useChartConfig';

export const useChartInit = ({ activeTool, chartType = 'candle' }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const volSeriesRef = useRef(null); 

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const tvConfig = getTradingViewConfig();
        
        const chart = createChart(chartContainerRef.current, {
            ...tvConfig,
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                ...tvConfig.timeScale,
                rightOffset: 12, // MSPK: Add breathing room on the right
                fixRightEdge: false, // Ensure we can scroll past data
                fixLeftEdge: false, // MSPK: Allow infinite scroll left
                borderVisible: false, // MSPK: Hide Bottom Line
                borderColor: 'transparent', // FORCE TRANSPARENT
                tickMarkFormatter: (time, tickMarkType) => {
                    const date = new Date(time * 1000);
                    const istOptions = { timeZone: 'Asia/Kolkata' };
                    
                    if (tickMarkType === 0) return date.toLocaleDateString('en-IN', { ...istOptions, year: 'numeric' });
                    if (tickMarkType === 1) return date.toLocaleDateString('en-IN', { ...istOptions, month: 'short' });
                    if (tickMarkType === 2) return date.toLocaleDateString('en-IN', { ...istOptions, day: 'numeric' });
                    
                    return date.toLocaleTimeString('en-IN', {
                        ...istOptions,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }
            },
            localization: {
                locale: 'en-IN',
                timeFormatter: (time) => {
                    const date = new Date(time * 1000);
                    return date.toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    });
                },
            },
        });

        // Create Main Series based on Type
        let mainSeries;
        if (chartType === 'line') {
             mainSeries = chart.addAreaSeries({
                topColor: 'rgba(34, 197, 94, 0.56)',
                bottomColor: 'rgba(34, 197, 94, 0.04)',
                lineColor: '#22c55e',
                lineWidth: 2,
            });
        } else {
             // 'candle' or 'heiken' (both use CandlestickSeries)
             mainSeries = chart.addCandlestickSeries({
                upColor: '#10b981',
                borderDownColor: '#ef4444',
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
                priceFormat: {
                    type: 'price',
                    precision: 2,
                    minMove: 0.01,
                },
                wickDownColor: '#ef4444',
            });
        }

        // Create Volume Series
        const volSeries = chart.addHistogramSeries({
            color: 'rgba(16, 185, 129, 0.5)',
            priceFormat: { 
                type: 'custom',
                formatter: (price) => {
                    if (price >= 1000000) return (price / 1000000).toFixed(2) + 'M';
                    if (price >= 1000) return (price / 1000).toFixed(2) + 'K';
                    if (price < 1) return price.toFixed(5);
                    if (price < 10) return price.toFixed(4);
                    if (price < 100) return price.toFixed(2);
                    return price.toFixed(0);
                }
            },
            priceScaleId: '', // Overlay
        });
        volSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        // Store refs
        chartRef.current = chart;
        seriesRef.current = mainSeries;
        volSeriesRef.current = volSeries;
        chart.volSeries = volSeries; 

        // Resize Observer
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ 
                    width: chartContainerRef.current.clientWidth, 
                    height: chartContainerRef.current.clientHeight 
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
            volSeriesRef.current = null;
        };
    }, [chartType]); // Re-init on chartType change

    // Update crosshair when tool changes
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.applyOptions({
            crosshair: {
                mode: activeTool === 'crosshair' ? 1 : (activeTool === 'arrow' ? 2 : 1),
                vertLine: { visible: activeTool === 'crosshair' },
                horzLine: { visible: activeTool === 'crosshair' }
            }
        });
    }, [activeTool]);

    return { chartContainerRef, chartRef, seriesRef, volSeriesRef };
};
