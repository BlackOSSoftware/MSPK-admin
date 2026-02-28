import React, { useRef, useEffect, useState } from 'react';
import { WebGLChart } from '../../utils/webgl/WebGLChart';
import { useInstantChart } from './hooks/useInstantChart';
import { useMobileAdaptive } from './hooks/useMobileAdaptive';

const TradingChartGL = ({
    symbol,
    timeframe,
    chartType = 'candle',
    indicators = []
}) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const chartEngineRef = useRef(null);

    // Mobile / Performance Optimization
    const { maxVisibleCandles, fpsLimit, isMobile } = useMobileAdaptive();

    // Using Instant Chart Hook (Pool + Cache + Worker)
    const {
        data: fullData,
        isLoading
    } = useInstantChart({
        symbol,
        timeframe
    });

    // Adapt Data Size
    // If mobile, take last N candles only to save GPU memory/Vertex Count
    const chartData = (isMobile && fullData.length > maxVisibleCandles)
        ? fullData.slice(-maxVisibleCandles)
        : fullData;

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        // Initialize Engine
        const engine = new WebGLChart(canvasRef.current);
        chartEngineRef.current = engine;

        // Resize Observer
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || !entries[0]) return;
            const { width, height } = entries[0].contentRect;
            engine.resize(width, height);
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            // Engine cleanup if needed
        };
    }, []);

    // Effect to Update Data
    useEffect(() => {
        if (chartEngineRef.current && chartData && chartData.length > 0) {
            console.log("GL Chart: Updating Data", chartData.length);
            chartEngineRef.current.setData(chartData);
        }
    }, [chartData]);

    // Performance Overlay
    const [fps, setFps] = useState(60);
    useEffect(() => {
        let lastTime = performance.now();
        let frame = 0;
        const loop = () => {
            frame++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(frame);
                frame = 0;
                lastTime = now;
            }
            requestAnimationFrame(loop);
        };
        const id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <div className="relative w-full h-full bg-gray-900 overflow-hidden" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="block w-full h-full touch-none select-none"
                style={{ cursor: 'crosshair' }}
            />

            {/* Overlay UI (Axes could go here) */}
            <div className="absolute top-2 left-2 text-xs font-mono text-green-400 bg-black/50 p-1 rounded z-10 pointer-events-none">
                WebGL Engine | {fps} FPS | {chartData?.length || 0} Candles
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
};

export default TradingChartGL;
