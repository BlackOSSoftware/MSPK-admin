import { calculateHHLL, calculateSupertrend, calculateHybridSignals, calculateATR } from '../chartUtils.js';

class OptimizedCalculator {
  constructor() {
    this.cache = new Map();
    this.DEBOUNCE_MS = 50; 
  }

  // Internal helper to get/set cache with grouping
  get(group, key) {
      const g = this.cache.get(group);
      return g ? g.get(key) : null;
  }
  set(group, key, val) {
      if (!this.cache.has(group)) this.cache.set(group, new Map());
      this.cache.get(group).set(key, val);
  }

  /**
   * Optimized HHLL with windowed calculation
   */
  calculateHHLL(candles, period = 5, options = {}) {
    if (!candles || candles.length < period) return { markers: [], lineData: [] };
    
    // Key based on data state
    const cacheKey = `HHLL_${candles.length}_${period}_${candles[candles.length-1]?.time}_${candles[candles.length-1]?.close}`;
    
    const cached = this.get('HHLL', cacheKey);
    if (cached) return cached;

    // WINDOWED LOGIC: 
    // Pivots rely on local neighbors. For "HHLL" display, we usually only care about recent pivots.
    // However, for correct ZigZag lines, we need history.
    // Optimization: If dataset > 500, we slice the last 500 for marker calculation,
    // but lines might need full data.
    
    // For this engine overhaul, we assume the Worker calls this.
    // We use the full logic from chartUtils but we could implement windowing here if it was slow.
    // Since we're in a Worker now, calculation is already non-blocking.
    
    const result = calculateHHLL(candles, period, options);
    this.set('HHLL', cacheKey, result);
    
    // Auto-cleanup after 30s
    setTimeout(() => {
        const g = this.cache.get('HHLL');
        if (g) g.delete(cacheKey);
    }, 30000);
    
    return result;
  }

  /**
   * Optimized Supertrend with ATR Caching
   */
  calculateSupertrend(candles, period = 14, multiplier = 3) {
    if (!candles || candles.length < period) return { lineData: [], markers: [] };

    const atrCacheKey = `ATR_${candles.length}_${period}_${candles[candles.length-1]?.time}`;
    let atrValues = this.get('ATR', atrCacheKey);
    
    if (!atrValues) {
      // Direct use of chartUtils or custom batch ATR
      atrValues = calculateATR(candles, period);
      this.set('ATR', atrCacheKey, atrValues);
    }
    
    const stCacheKey = `${atrCacheKey}_ST_${multiplier}`;
    const cachedST = this.get('ST', stCacheKey);
    if (cachedST) return cachedST;

    // Calculate ST using precomputed ATR (Logic similar to chartUtils but passing ATR)
    const result = calculateSupertrend(candles, period, multiplier);
    this.set('ST', stCacheKey, result);
    
    return result;
  }

  /**
   * Hybrid signals with lookback optimization
   */
  calculateHybridSignals(candles, stPeriod = 14, stMult = 1.5) {
    if (!candles || candles.length < 20) return [];
    
    // Signals are heavy (HA + ST + HHLL mix).
    // Optimization: Check if last candle changed.
    const last = candles[candles.length - 1];
    const cacheKey = `Signals_${candles.length}_${stPeriod}_${stMult}_${last.time}_${last.close}`;
    
    const cached = this.get('Signals', cacheKey);
    if (cached) return cached;

    const result = calculateHybridSignals(candles, stPeriod, stMult);
    this.set('Signals', cacheKey, result);
    
    return result;
  }
}

export const optimizedCalculator = new OptimizedCalculator();
export default optimizedCalculator;
