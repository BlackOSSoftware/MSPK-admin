/* eslint-disable no-restricted-globals */
let optimizedCalculator = null;

// Dynamic Loader to catch import errors better
const initEngine = async () => {
    try {
        console.log('[Worker] Loading calculation engine...');
        const module = await import('../utils/chart/optimizedCalculations.js');
        optimizedCalculator = module.optimizedCalculator || module.default;
        console.log('[Worker] Engine loaded successfully.');
        self.postMessage({ type: 'BOOTREADY' });
    } catch (err) {
        console.error('[Worker] Engine Load Failed:', err);
    }
};

initEngine();

self.onerror = function(message, source, lineno, colno, error) {
    console.error('[Worker Top-Level Error]', { message, source, lineno, colno, error });
};

self.onmessage = async (e) => {
    try {
        if (!e.data || typeof e.data !== 'object') return;
        const { id, type, data, config: params = {} } = e.data;
        if (!type) return;

        // Wait for engine if not ready
        if (!optimizedCalculator) {
            console.warn('[Worker] Engine not ready, skipping message:', type);
            return;
        }

        let result = null;
        const start = performance.now();

        switch (type.toUpperCase()) {
            case 'HHLL':
                result = optimizedCalculator.calculateHHLL(data, params.period, params.options);
                break;
            case 'SUPERTREND':
                result = optimizedCalculator.calculateSupertrend(data, params.period, params.multiplier);
                break;
            case 'HYBRIDSIGNALS':
            case 'SIGNALS':
                result = optimizedCalculator.calculateHybridSignals(data, params.period, params.multiplier);
                break;
            case 'SMA':
                result = optimizedCalculator.calculateSMA ? optimizedCalculator.calculateSMA(data, params.period) : [];
                break;
            case 'EMA':
                result = optimizedCalculator.calculateEMA ? optimizedCalculator.calculateEMA(data, params.period) : [];
                break;
            case 'RSI':
                result = optimizedCalculator.calculateRSI ? optimizedCalculator.calculateRSI(data, params.period) : [];
                break;
            default:
                break;
        }
        
        const duration = performance.now() - start;
        self.postMessage({ id, success: true, result, metrics: { duration } });
    } catch (error) {
        console.error('[Worker Runtime Error]', error);
        self.postMessage({ id: e.data?.id, success: false, error: error.message });
    }
};
