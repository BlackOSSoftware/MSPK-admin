import { useRef, useEffect } from 'react';

export const useChartDrawings = ({ chartRef, seriesRef, drawings, activeTool, lastCrosshairRef, setDrawings }) => {
    const drawingsRef = useRef([]);

    // Render drawings
    useEffect(() => {
        if (!seriesRef.current) return;
        const series = seriesRef.current;

        // Clear existing local drawings
        drawingsRef.current.forEach(line => series.removePriceLine(line));
        drawingsRef.current = [];

        // Draw current drawings
        drawings.forEach((d, idx) => {
            const line = series.createPriceLine({
                price: d.price,
                color: d.color || '#3b82f6',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: d.title || `Line ${idx + 1}`
            });
            drawingsRef.current.push(line);
        });
    }, [drawings, seriesRef.current]);

    // Handle Clicks (Creation)
    const handleChartClick = () => {
         if (activeTool === 'line' && lastCrosshairRef.current) {
            setDrawings(prev => [...prev, {
                price: lastCrosshairRef.current.price,
                color: '#3b82f6',
                title: 'Price Line'
            }]);
        }
    };

    return { handleChartClick };
};
