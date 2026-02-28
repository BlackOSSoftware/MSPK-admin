
/**
 * Calculate Heiken Ashi candles from standard OHLC candles
 */
const calculateHeikenAshi = (candles) => {
    if (!candles || candles.length === 0) return [];
    const haCandles = [];
    let prevHa = {
        open: candles[0].open,
        close: candles[0].close,
        high: candles[0].high,
        low: candles[0].low
    };
    haCandles.push({ ...candles[0] });
    for (let i = 1; i < candles.length; i++) {
        const curr = candles[i];
        const haClose = (curr.open + curr.high + curr.low + curr.close) / 4;
        const haOpen = (prevHa.open + prevHa.close) / 2;
        const haHigh = Math.max(curr.high, haOpen, haClose);
        const haLow = Math.min(curr.low, haOpen, haClose);
        const haCandle = {
            time: curr.time,
            open: haOpen,
            high: haHigh,
            low: haLow,
            close: haClose,
            volume: curr.volume
        };
        haCandles.push(haCandle);
        prevHa = haCandle;
    }
    return haCandles;
};

/**
 * Calculate a single Heiken Ashi candle update
 */
const updateHeikenAshi = (prevHa, currentRaw) => {
    if (!prevHa) return currentRaw;
    const haClose = (currentRaw.open + currentRaw.high + currentRaw.low + currentRaw.close) / 4;
    const haOpen = (prevHa.open + prevHa.close) / 2;
    const haHigh = Math.max(currentRaw.high, haOpen, haClose);
    const haLow = Math.min(currentRaw.low, haOpen, haClose);
    return {
        time: currentRaw.time,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: currentRaw.volume
    };
};

/**
 * Format price
 */
const formatPrice = (val, symbolStr) => {
    if (val === undefined || val === null) return '0.00';
    const decimals = (symbolStr?.includes('USD') || symbolStr?.includes('EUR')) ? 5 : 2;
    return val.toFixed(decimals);
};

/**
 * Calculate Simple Moving Average (SMA)
 */
const calculateSMA = (data, period) => {
    if (!data || data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        result.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return result;
};

/**
 * Calculate Exponential Moving Average (EMA)
 */
const calculateEMA = (data, period) => {
    if (!data || data.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let sum = 0;
    for (let j = 0; j < period; j++) {
        sum += data[j].close;
    }
    let prevEma = sum / period;
    result.push({ time: data[period - 1].time, value: prevEma });
    for (let i = period; i < data.length; i++) {
        const close = data[i].close;
        const ema = (close * k) + (prevEma * (1 - k));
        result.push({
            time: data[i].time,
            value: ema
        });
        prevEma = ema;
    }
    return result;
};

/**
 * Calculate True Range (TR)
 */
const calculateTR = (current, prev) => {
    const hl = current.high - current.low;
    if (!prev) return hl;
    const hpc = Math.abs(current.high - prev.close);
    const lpc = Math.abs(current.low - prev.close);
    return Math.max(hl, hpc, lpc);
};

/**
 * Calculate ATR (Average True Range)
 */
const calculateATR = (data, period) => {
    if (!data || data.length < period) return [];
    const trs = [];
    for (let i = 0; i < data.length; i++) {
        const prev = i > 0 ? data[i-1] : null;
        trs.push(calculateTR(data[i], prev));
    }
    const atr = [];
    let sum = 0;
    for (let j = 0; j < period; j++) sum += trs[j];
    let prevAtr = sum / period;
    atr.push({ index: period-1, value: prevAtr });
    for (let i = period; i < data.length; i++) {
        prevAtr = (prevAtr * (period - 1) + trs[i]) / period;
        atr.push({ index: i, value: prevAtr });
    }
    return atr;
};

/**
 * Helper to get price
 */
const getSourcePrice = (candle, source) => {
    switch (source) {
        case 'close': return candle.close;
        case 'high': return candle.high;
        case 'low': return candle.low;
        case 'open': return candle.open;
        case 'hl2': return (candle.high + candle.low) / 2;
        case 'hlc3': return (candle.high + candle.low + candle.close) / 3;
        case 'ohlc4': return (candle.open + candle.high + candle.low + candle.close) / 4;
        default: return (candle.high + candle.low) / 2;
    }
};

/**
 * Calculate Supertrend
 */
const calculateSupertrend = (data, period = 10, multiplier = 3, source = 'hl2') => {
    if (!data || data.length < period) return { lineData: [], markers: [] };
    const atrData = calculateATR(data, period);
    const lineData = [];
    const markers = [];
    
    // Quick access map
    const atrMap = new Map();
    atrData.forEach(a => atrMap.set(a.index, a.value));

    let prevFinalUpper = 0;
    let prevFinalLower = 0;
    let prevTrend = 1;

    for (let i = period - 1; i < data.length; i++) {
        const candle = data[i];
        const prevCandle = i > 0 ? data[i-1] : null;
        const atr = atrMap.get(i);
        
        if (!atr) continue;

        const srcPrice = getSourcePrice(candle, source);
        const basicUpper = srcPrice + multiplier * atr;
        const basicLower = srcPrice - multiplier * atr;

        let finalUpper = basicUpper;
        let finalLower = basicLower;

        if (prevCandle && i > period - 1) {
             if (basicUpper < prevFinalUpper || prevCandle.close > prevFinalUpper) {
                 finalUpper = basicUpper;
             } else {
                 finalUpper = prevFinalUpper;
             }

             if (basicLower > prevFinalLower || prevCandle.close < prevFinalLower) {
                 finalLower = basicLower;
             } else {
                 finalLower = prevFinalLower;
             }
        }

        let trend = prevTrend;
        // Direction change logic
        if (trend === 1) {
             if (candle.close < finalLower) {
                 trend = -1;
             }
        } else {
             if (candle.close > finalUpper) {
                 trend = 1;
             }
        }

        // Marker Logic: Detect Flip
        if (i > period && trend !== prevTrend) {
            markers.push({
                time: candle.time,
                position: trend === 1 ? 'belowBar' : 'aboveBar',
                color: trend === 1 ? '#10B981' : '#EF4444', // TradingView Green/Red
                shape: trend === 1 ? 'arrowUp' : 'arrowDown',
                text: trend === 1 ? 'Buy' : 'Sell',
                size: 2
            });
        }

        lineData.push({
            time: candle.time,
            value: trend === 1 ? finalLower : finalUpper,
            trend: trend,
            color: trend === 1 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'
        });

        prevFinalUpper = finalUpper;
        prevFinalLower = finalLower;
        prevTrend = trend;
    }

    return { lineData, markers };
};

/**
 * Calculate Higher Highs Lower Lows (HHLL)
 */
const calculateHHLL = (data, period = 5, options = {}) => {
    const { upColor = 'rgba(16, 185, 129, 0.8)', downColor = 'rgba(239, 68, 68, 0.8)', showLabels = true } = options;
    if (!data || data.length < period * 2 + 1) return { markers: [], lineData: [], upSegments: [], downSegments: [] };
    const rawPivots = [];
    for (let i = period; i < data.length - period; i++) {
        const potential = data[i];
        let isHigh = true;
        let isLow = true;
        for (let j = 1; j <= period; j++) {
            if (data[i - j].high > potential.high || data[i + j].high > potential.high) isHigh = false;
            if (data[i - j].low < potential.low || data[i + j].low < potential.low) isLow = false;
        }
        if (isHigh) rawPivots.push({ time: potential.time, price: potential.high, type: 'H', index: i });
        if (isLow) rawPivots.push({ time: potential.time, price: potential.low, type: 'L', index: i });
    }
    if (rawPivots.length === 0) return { markers: [], lineData: [], upSegments: [], downSegments: [] };
    const filteredPivots = [];
    let lastPivot = null;
    for (const current of rawPivots) {
        if (!lastPivot) {
            filteredPivots.push(current);
            lastPivot = current;
            continue;
        }
        if (current.type === lastPivot.type) {
            if (current.type === 'H') {
                if (current.price > lastPivot.price) {
                    filteredPivots[filteredPivots.length - 1] = current;
                    lastPivot = current;
                }
            } else {
                if (current.price < lastPivot.price) {
                    filteredPivots[filteredPivots.length - 1] = current;
                    lastPivot = current;
                }
            }
        } else {
            filteredPivots.push(current);
            lastPivot = current;
        }
    }
    const markers = [];
    const upSegments = [];
    const downSegments = [];
    const lineData = [];
    let prevHigh = null;
    let prevLow = null;
    filteredPivots.forEach((p, idx) => {
        lineData.push({ time: p.time, value: p.price });
        let label = p.type;
        if (p.type === 'H') {
            if (prevHigh) label = p.price > prevHigh.price ? 'HH' : 'LH';
            prevHigh = p;
        } else {
            if (prevLow) label = p.price < prevLow.price ? 'LL' : 'HL';
            prevLow = p;
        }
        markers.push({
            time: p.time,
            position: p.type === 'H' ? 'aboveBar' : 'belowBar',
            color: p.type === 'H' ? downColor : upColor,
            shape: p.type === 'H' ? 'arrowDown' : 'arrowUp',
            text: showLabels ? label : '',
            size: 1
        });
        if (idx > 0) {
            const prev = filteredPivots[idx - 1];
            const segment = [
                { time: prev.time, value: prev.price },
                { time: p.time, value: p.price }
            ];
            if (p.price > prev.price) upSegments.push(segment);
            else downSegments.push(segment);
        }
    });
    return { markers, lineData, upSegments, downSegments };
};

/**
 * Calculate Relative Strength Index (RSI)
 */
const calculateRSI = (data, period = 14, source = 'close') => {
    if (!data || data.length <= period) return [];
    const results = [];
    let gains = [];
    let losses = [];
    for (let i = 1; i < data.length; i++) {
        const curr = getSourcePrice(data[i], source);
        const prev = getSourcePrice(data[i-1], source);
        const change = curr - prev;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
        avgGain += gains[i];
        avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    results.push({ time: data[period].time, value: rsi });
    for (let i = period + 1; i < data.length; i++) {
        const change = getSourcePrice(data[i], source) - getSourcePrice(data[i-1], source);
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
        results.push({ time: data[i].time, value: rsi, trend: rsi > 50 ? 1 : (rsi < 50 ? -1 : 0) });
    }
    return results;
};

/**
 * Calculate Parabolic SAR (PSAR)
 */
const calculatePSAR = (data, start = 0.02, increment = 0.02, max = 0.2) => {
    if (!data || data.length < 2) return [];
    let psar = data[0].low;
    let trend = 1;
    let af = start;
    let ep = data[0].high;
    if (data[1].close < data[0].close) {
        trend = -1;
        psar = data[0].high;
        ep = data[0].low;
    }
    const results = [];
    results.push({ time: data[1].time, value: psar, trend: trend }); 
    for (let i = 2; i < data.length; i++) {
        const prev = data[i-1];
        const prevPsar = psar;
        let nextPsar = prevPsar + af * (ep - prevPsar);
        if (trend === 1) {
            nextPsar = Math.min(nextPsar, data[i-1].low, i >= 2 ? data[i-2].low : data[i-1].low);
            if (prev.low < nextPsar) {
                trend = -1;
                psar = ep;
                af = start;
                ep = prev.low;
            } else {
                psar = nextPsar;
                if (prev.high > ep) {
                    ep = prev.high;
                    af = Math.min(af + increment, max);
                }
            }
        } else {
            nextPsar = Math.max(nextPsar, data[i-1].high, i >= 2 ? data[i-2].high : data[i-1].high);
            if (prev.high > nextPsar) {
                trend = 1;
                psar = ep;
                af = start;
                ep = prev.high;
            } else {
                psar = nextPsar;
                if (prev.low < ep) {
                    ep = prev.low;
                    af = Math.min(af + increment, max);
                }
            }
        }
        results.push({ time: data[i].time, value: psar, trend: trend });
    }
    return results;
};

/**
 * Calculate Hybrid Strategy Signals
 */
const calculateHybridSignals = (data, stPeriod = 14, stMult = 1.5) => {
    if (!data || data.length < 50) return [];
    const haCandles = calculateHeikenAshi(data);
    const { lineData: stData } = calculateSupertrend(haCandles, stPeriod, stMult);
    const { markers: structureMarkers } = calculateHHLL(haCandles, 5);
    const isWickValid = (candle, type) => {
        const bodySize = Math.abs(candle.close - candle.open);
        const totalSize = candle.high - candle.low;
        if (totalSize === 0) return true;
        if (type === 'BUY') {
            const upperWick = candle.high - Math.max(candle.open, candle.close);
            const lowerWick = Math.min(candle.open, candle.close) - candle.low;
            return upperWick > 0 && lowerWick <= (totalSize * 0.2);
        } else {
            const lowerWick = Math.min(candle.open, candle.close) - candle.low;
            const upperWick = candle.high - Math.max(candle.open, candle.close);
            return lowerWick > 0 && upperWick <= (totalSize * 0.2);
        }
    };
    const markers = [];
    const stMap = new Map();
    if (stData && Array.isArray(stData)) {
        stData.forEach(d => stMap.set(d.time, d));
    }
    const structureMap = new Map();
    structureMarkers.forEach(m => structureMap.set(m.time, m.text));
    for (let i = 3; i < haCandles.length; i++) {
        const entryCandle = haCandles[i];
        const confirmCandle = haCandles[i-1];
        const flipCandle = haCandles[i-2];
        const stConfirm = stMap.get(confirmCandle.time);
        const stFlip = stMap.get(flipCandle.time);
        const stPre = stMap.get(haCandles[i-3].time);
        if (!stConfirm || !stFlip || !stPre) continue;
        let lastStructure = null;
        for (let j = i-1; j > 0; j--) {
            if (structureMap.has(haCandles[j].time)) {
                lastStructure = structureMap.get(haCandles[j].time);
                break;
            }
        }
        // Logic simplified to match Visual Supertrend triggers exactly
        // Fix: Use stFlip (i-2) instead of stPre (i-3) to ensure adjacent check and prevent double signals
        if (stConfirm.trend === 1 && stFlip.trend === -1) {
             markers.push({ time: confirmCandle.time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'BUY', size: 2 });
        } else if (stConfirm.trend === -1 && stFlip.trend === 1) {
             markers.push({ time: confirmCandle.time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'SELL', size: 2 });
        }
    }
    return markers;
};

export {
    calculateHeikenAshi,
    updateHeikenAshi,
    formatPrice,
    calculateSMA,
    calculateEMA,
    calculateATR,
    calculateSupertrend,
    calculateHHLL,
    calculateRSI,
    calculatePSAR,
    calculateHybridSignals
};
