import React, { useState, useEffect, useRef } from 'react';
import indicatorCache from '../../utils/performance/indicatorCache';

/**
 * PerformanceMonitor
 * Real-time monitoring of Chart Performance (FPS, Memory, Cache)
 */
const PerformanceMonitor = () => {
    const [metrics, setMetrics] = useState({
        fps: 60,
        memory: 0,
        calculationTime: 0,
        renderTime: 0,
        cacheHitRate: 0
    });

    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    const rafId = useRef(null);

    // FPS Measurement Logic
    useEffect(() => {
        const measure = () => {
            frameCount.current++;
            const now = performance.now();

            if (now >= lastTime.current + 1000) {
                const fps = (frameCount.current * 1000) / (now - lastTime.current);

                // Update Metrics
                setMetrics(prev => ({
                    ...prev,
                    fps: fps,
                    memory: window.performance?.memory?.usedJSHeapSize || 0,
                    cacheHitRate: indicatorCache.getHitRate(),
                    // Combined calc/render time from global trackers if available
                    calculationTime: window.lastCalcDuration || 0,
                    renderTime: window.lastRenderDuration || 0
                }));

                frameCount.current = 0;
                lastTime.current = now;
            }

            rafId.current = requestAnimationFrame(measure);
        };

        rafId.current = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(rafId.current);
    }, []);

    return (
        <div className="fixed bottom-4 left-4 z-[9999] bg-[#0f172a]/90 backdrop-blur border border-slate-800 p-2 rounded shadow-lg text-[10px] font-mono text-slate-300 flex flex-col gap-1 pointer-events-none">
            <div className="flex justify-between gap-4 border-b border-slate-700 pb-1 mb-1 font-bold text-blue-400 uppercase tracking-tighter">
                <span>Engine Performance</span>
            </div>

            <div className="flex justify-between gap-4">
                <span>FPS:</span>
                <span className={metrics.fps >= 55 ? 'text-green-500' : metrics.fps >= 45 ? 'text-yellow-500' : 'text-red-500 animate-pulse'}>
                    {metrics.fps.toFixed(1)}
                </span>
            </div>

            <div className="flex justify-between gap-8">
                <span>Heap Usage:</span>
                <span className="text-blue-400">{(metrics.memory / 1024 / 1024).toFixed(1)} MB</span>
            </div>

            <div className="flex justify-between gap-4">
                <span>Cache Hit Rate:</span>
                <span className="text-emerald-400">{(metrics.cacheHitRate * 100).toFixed(0)}%</span>
            </div>

            <div className="flex justify-between gap-4">
                <span>Avg Calc:</span>
                <span className="text-orange-400">{metrics.calculationTime.toFixed(1)} ms</span>
            </div>

            {metrics.fps < 50 && (
                <div className="text-red-400 text-[8px] mt-1 border-t border-red-900/50 pt-1">
                    ⚠️ PRESSURE DETECTED - LOD ENABLED
                </div>
            )}
        </div>
    );
};

export default PerformanceMonitor;
