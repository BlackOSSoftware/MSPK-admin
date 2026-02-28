import { useRef, useEffect } from 'react';

export const useChartSignals = ({ activeSignals, seriesRef, isHistoryLoaded }) => {
    const signalLinesRef = useRef([]);

    useEffect(() => {
        // Must have series and loaded history
        if (!seriesRef.current) return;
        const series = seriesRef.current;

        // Clean up OLD lines
        signalLinesRef.current.forEach(line => series.removePriceLine(line));
        signalLinesRef.current = [];

        if (!isHistoryLoaded.current) return;
        if (!activeSignals || activeSignals.length === 0) return;

        activeSignals.forEach(signal => {
            const entryPrice = parseFloat(signal.entryPrice);
            if (!entryPrice || isNaN(entryPrice)) return;

            // 1. Entry Line
            const entryLine = series.createPriceLine({
                price: entryPrice,
                color: '#10b981', // Emerald 500
                lineWidth: 2,
                lineStyle: 1, // Dotted
                axisLabelVisible: true,
                title: `ENTRY (${signal.type})`,
            });
            signalLinesRef.current.push(entryLine);

            // 2. Stop Loss
            const slPrice = parseFloat(signal.stopLoss);
            if (slPrice && !isNaN(slPrice)) {
                const slLine = series.createPriceLine({
                    price: slPrice,
                    color: '#ef4444', // Red 500
                    lineWidth: 2,
                    lineStyle: 0, // Solid
                    axisLabelVisible: true,
                    title: 'STOPLOSS',
                });
                signalLinesRef.current.push(slLine);
            }

            // 3. Targets
            if (signal.targets) {
                Object.values(signal.targets).forEach((tgt, idx) => {
                    const tgtPrice = parseFloat(tgt);
                    if (!tgtPrice || isNaN(tgtPrice)) return;

                    const tgtLine = series.createPriceLine({
                        price: tgtPrice,
                        color: '#3b82f6', // Blue 500
                        lineWidth: 1,
                        lineStyle: 2, // Dashed
                        axisLabelVisible: true,
                        title: `TARGET ${idx + 1}`,
                    });
                    signalLinesRef.current.push(tgtLine);
                });
            }
        });

    }, [activeSignals, isHistoryLoaded.current]); // Re-run when signals change
    
    // Note: isHistoryLoaded is a ref, so changing it won't trigger effect by itself. 
    // We might need to depend on a state that indicates 'loaded' or just let parent component trigger re-render.
    // In TradingChart, we didn't have a state for 'loaded', just a ref.
    // But signals usually come IN after load or persist.
    // If activeSignals is state, it works fine.
};
