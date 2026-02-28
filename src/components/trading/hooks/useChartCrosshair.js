import { useEffect, useRef } from 'react';

export const useChartCrosshair = ({ chartRef, seriesRef, volSeriesRef, setLegend, lastCandleRef }) => {
    
    const lastCrosshairRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !seriesRef.current) return;
        const chart = chartRef.current;
        const series = seriesRef.current;
        const volSeries = volSeriesRef.current;

        const handleCrosshairMove = (param) => {
            if (param.time && param.seriesData.get(series)) {
                const data = param.seriesData.get(series);
                const vol = volSeries ? param.seriesData.get(volSeries) : { value: 0 };
                const change = data.close - data.open;
                const percent = (change / data.open) * 100;

                setLegend({
                    open: data.open, high: data.high, low: data.low, close: data.close,
                    change: change, percent: percent,
                    color: change >= 0 ? 'text-emerald-500' : 'text-destructive',
                    volume: vol ? vol.value : 0
                });

                // Update crosshair ref
                lastCrosshairRef.current = { price: data.close, time: param.time };
            } else {
                // Clear crosshair ref when mouse leaves
                lastCrosshairRef.current = null;

                // Revert to latest candle if exists
                 if (lastCandleRef.current) {
                    const last = lastCandleRef.current;
                    setLegend({
                        open: last.open, high: last.high, low: last.low, close: last.close,
                        change: last.close - last.open,
                        percent: ((last.close - last.open) / last.open) * 100,
                        color: last.close >= last.open ? 'text-emerald-500' : 'text-destructive',
                        volume: last.volume || 0 
                    });
                }
            }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);

        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
    }, [chartRef.current, seriesRef.current]); // Re-attach if chart instances change (init)

    return { lastCrosshairRef };
};
