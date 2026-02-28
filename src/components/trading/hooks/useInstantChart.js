import { useState, useEffect, useRef } from 'react';
import instancePool from '../../../utils/ChartInstancePool';
import chartCache from '../../../utils/ChartDataCache';
import { useWorkerIndicators } from './useWorkerIndicators';

export const useInstantChart = ({ symbol, timeframe }) => {
    const [data, setData] = useState([]);
    const [indicators, setIndicators] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    
    // Check Pool on Mount/Change
    useEffect(() => {
        if (!symbol) return;
        
        const cached = instancePool.getChart(symbol.symbol);
        
        if (cached && cached.candles && cached.candles.length > 0) {
            // INSTANT HIT
            console.log('[InstantChart] Pool Hit');
            setData(cached.candles);
            setIndicators(cached.indicators);
            setIsLoading(false);
            
            // Still check for fresh updates implicitly via socket elsewhere
        } else {
            // MISS -> Standard Load
            console.log('[InstantChart] Pool Miss, Fetching...');
            setIsLoading(true);
            
            chartCache.getCandles(symbol.symbol, timeframe)
                .then(candles => {
                    setData(candles || []);
                    setIsLoading(false);
                    // Trigger Worker Calc here or use useWorkerIndicators hook?
                    // The hook below handles calculation if data changes.
                });
        }
    }, [symbol?.symbol, timeframe]);

    // Background Calc for MISS case or Updates
    // If we hit cache, we setIndicators directly.
    // If we miss, we get data, then this hook calculates.
    const { indicatorData, isCalculating } = useWorkerIndicators(data, [
        { type: 'SUPERTREND', period: 10, multiplier: 3 },
        { type: 'RSI', period: 14 }
    ]);

    // Merge Pool Indicators with Freshly Calculated ones
    const finalIndicators = { ...indicators, ...indicatorData };

    return { 
        data, 
        indicators: finalIndicators, 
        isLoading: isLoading && data.length === 0 
    };
};
