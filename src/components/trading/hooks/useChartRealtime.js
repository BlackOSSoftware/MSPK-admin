import { useEffect } from 'react';
import { updateHeikenAshi } from '../../../utils/chartUtils';

export const useChartRealtime = ({ 
    symbol, 
    latestTick, 
    timeframe, 
    chartType, 
    seriesRef, 
    volSeriesRef, 
    currentDataRef, 
    currentRawCandleRef,
    lastCandleRef, 
    lastHeikenRef, 
    chartRef, 
    onUpdateLegend,
    isHistoryLoaded // Prop passed from useChartData
}) => {

    useEffect(() => {
        if (!latestTick) return;
        
        if (!seriesRef.current) return;

        // GUARD: Block ticks until history is ready
        if (!isHistoryLoaded || !isHistoryLoaded.current) {
             return;
        }

        const price = parseFloat(latestTick.price);
        const volume = parseFloat(latestTick.volume || 0);
        if (!price) return;

        const now = Math.floor(Date.now() / 1000);
        
        // Determine resolution seconds
        let resolutionSeconds = 300; 
        if (timeframe === '1') resolutionSeconds = 60;
        else if (timeframe === '3') resolutionSeconds = 180;
        else if (timeframe === '5') resolutionSeconds = 300;
        else if (timeframe === '10') resolutionSeconds = 600;
        else if (timeframe === '15') resolutionSeconds = 900;
        else if (timeframe === '30') resolutionSeconds = 1800;
        else if (timeframe === '60') resolutionSeconds = 3600;
        else if (timeframe === '120') resolutionSeconds = 7200;
        else if (timeframe === '240') resolutionSeconds = 14400;
        else if (timeframe === 'D') resolutionSeconds = 86400;
        else if (timeframe === 'W') resolutionSeconds = 604800;
        else if (timeframe === 'M') resolutionSeconds = 2592000;

        const time = now - (now % resolutionSeconds);

        // Optimization: LOD (Level of Detail) filtering
        // If price change is < 0.001%, skip heavy DOM/Render updates unless it's a new candle
        const lastPrice = lastCandleRef.current ? lastCandleRef.current.close : 0;
        const diff = Math.abs(price - lastPrice);
        const threshold = lastPrice * 0.00001; // 0.001% change

        const isNewCandle = lastCandleRef.current && (time > lastCandleRef.current.time);

        if (!isNewCandle && lastPrice > 0 && diff < threshold) {
            return; // Skip update for micro-movements to save CPU/GPU
        }

        const currentCandle = lastCandleRef.current; // Displayed Candle (HA or Standard)
        const currentRaw = currentRawCandleRef?.current; // Raw Market Candle
        const currentVol = lastCandleRef.currentVol || { value: 0 };

        if (currentCandle && currentCandle.time === time) {
            // --- UPDATE EXISTING CANDLE ---
            
            // 1. Update RAW CANDLE
            let newRaw = { ...currentRaw };
            if (currentRaw && currentRaw.time === time) {
                newRaw.high = Math.max(currentRaw.high, price);
                newRaw.low = Math.min(currentRaw.low, price);
                newRaw.close = price;
            } else {
                 // Fallback if raw ref is missing/stale but active candle exists (shouldn't happen often)
                 newRaw = { time, open: price, high: price, low: price, close: price };
            }
            if (currentRawCandleRef) currentRawCandleRef.current = newRaw;

            // 2. Determine Display Candle
            let displayCandle = newRaw;

            if (chartType === 'heiken') {
                 // HA Logic:
                 // HA Open is fixed for current bar (derived from prev HA). 
                 // We read it from currentCandle.open (which is the HA open).
                 const haOpen = currentCandle.open;
                 const haClose = (newRaw.open + newRaw.high + newRaw.low + newRaw.close) / 4;
                 const haHigh = Math.max(newRaw.high, haOpen, haClose);
                 const haLow = Math.min(newRaw.low, haOpen, haClose);
                 
                 displayCandle = {
                     time: time,
                     open: haOpen,
                     high: haHigh,
                     low: haLow,
                     close: haClose
                 };
            }

            seriesRef.current.update(displayCandle);
            lastCandleRef.current = displayCandle;

            // Trigger Legend Update (Always show RAW Price for Close, but HA for O/H/L if HA?)
            // TradingView shows HA values in legend when HA is active.
            // But 'Price' label on scale shows Last Price usually. 
            // Lightweight charts 'update' sets the Last Price on scale to 'close'.
            // In HA, 'close' is HA Close, which differs from Market Price.
            // This is standard behavior.
            
            if (onUpdateLegend) {
                onUpdateLegend({
                    ...displayCandle,
                    change: price - displayCandle.open, 
                    percent: ((price - displayCandle.open) / displayCandle.open) * 100,
                    volume: (currentVol.value || 0) + volume,
                    isLive: true
                });
            }

            // Update Volume
            const newVol = {
                time: time,
                value: (currentVol.value || 0) + volume,
                color: displayCandle.close >= displayCandle.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
            };
            if (volSeriesRef.current) volSeriesRef.current.update(newVol);
            lastCandleRef.currentVol = newVol;

        } else {
            // --- NEW CANDLE ---
            // Check safety (time order)
            if (currentCandle && time < currentCandle.time) return;

            // 1. Initialize RAW
            // Open = Previous Raw Close (if available) else Current Price
            const rawOpen = currentRaw ? currentRaw.close : price;
            const newRaw = { time: time, open: rawOpen, high: price, low: price, close: price };
            if (currentRawCandleRef) currentRawCandleRef.current = newRaw;

            // 2. Initialize Display
            let displayCandle = newRaw;

            if (chartType === 'heiken') {
                 // Calculate New HA
                 // Open = (PrevHA.Open + PrevHA.Close) / 2
                 // We need PREV HA. lastCandleRef IS the prev HA (since we moved to new time).
                 const prevHa = lastCandleRef.current || { open: price, close: price };
                 
                 const haOpen = (prevHa.open + prevHa.close) / 2;
                 const haClose = (newRaw.open + newRaw.high + newRaw.low + newRaw.close) / 4;
                 const haHigh = Math.max(newRaw.high, haOpen, haClose);
                 const haLow = Math.min(newRaw.low, haOpen, haClose);

                 displayCandle = {
                     time: time,
                     open: haOpen,
                     high: haHigh,
                     low: haLow,
                     close: haClose
                 };
            }

            seriesRef.current.update(displayCandle);
            lastCandleRef.current = displayCandle;

            // Legend Update
            if (onUpdateLegend) {
                onUpdateLegend({
                    ...displayCandle,
                    change: 0,
                    percent: 0,
                    volume: volume,
                    isLive: true
                });
            }

            const newVol = { time: time, value: volume, color: 'rgba(16, 185, 129, 0.5)' };
            if (volSeriesRef.current) volSeriesRef.current.update(newVol);
            lastCandleRef.currentVol = newVol;
        }

    }, [latestTick, timeframe, chartType]); 
};
