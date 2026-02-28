import { useState, useEffect, useRef } from 'react';
import { WorkerPool } from '../../../utils/WorkerPool';
import IndicatorWorker from '../../../workers/indicator.worker?worker';

// Singleton Pool to avoid recreation
let pool = null;

export const useWorkerIndicators = (data, indicators = []) => {
    const [indicatorData, setIndicatorData] = useState({});
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Initialize pool once
    useEffect(() => {
        if (!pool) {
            console.log('[useWorkerIndicators] Init with WorkerPool v1.6 (Vite Worker Mode)');
            pool = new WorkerPool(() => new IndicatorWorker());
        }
    }, []);

    useEffect(() => {
        if (!data || data.length === 0 || indicators.length === 0) {
             return;
        }

        const runCalculations = async () => {
            setIsCalculating(true);
            const results = {};
            const promises = [];

            // Convert data to SharedArrayBuffer if supported and large enough?
            // For simplicity/compatibility, we transfer standard arrays first.
            // Optimization: If data > 10k, use Float32Array + Transferable.
            
            let transferData = data; 
            // Lightweight optimization: Map to pure object array if not already
            
            for (const ind of indicators) {
                // ind: { type: 'SMA', period: 20, ... }
                const promise = pool.execute(ind.type, transferData, ind)
                    .then(res => {
                        results[`${ind.type}_${ind.period}`] = res;
                    })
                    .catch(err => {
                        console.error(`Indicator Error (${ind.type}):`, err);
                    });
                promises.push(promise);
            }

            await Promise.all(promises);
            
            setIndicatorData(prev => ({ ...prev, ...results }));
            setIsCalculating(false);
        };

        runCalculations();

    }, [data, indicators]); // Deep compare indicators recommended in real app

    return { indicatorData, isCalculating };
};
