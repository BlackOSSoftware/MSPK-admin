import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, RefreshCw, ChevronsRight, MoreHorizontal, Activity, Settings, X, Waves, Minus, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatPrice } from '../../utils/chartUtils';
import ManualSignalPanel from './ManualSignalPanel';

const ChartOverlay = ({
    symbol,
    timeframe,
    legend,
    activeIndicators,
    showVolume,
    onRemoveIndicator,
    onEditIndicator,
    onQuickSignal,
    onZoomIn,
    onZoomOut,
    onScrollLeft,
    onScrollRight,
    onReset,
    onScrollToEnd,
    activeClouds = [], // { time, y1, y2, color }
    chartRef,
    seriesRef
}) => {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastRenderTimeRef = useRef(0);

    // --- OPTIMIZED CLOUD RENDERING ---
    const renderClouds = useCallback(() => {
        if (!canvasRef.current || !chartRef.current || !seriesRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const chart = chartRef.current;
        const series = seriesRef.current;
        const ctx = canvas.getContext('2d');

        // Always schedule next frame first - No FPS throttling for maximum smoothness
        animationFrameRef.current = requestAnimationFrame(renderClouds);

        // Get canvas container size
        const container = canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Sync dimensions perfectly
        const targetWidth = Math.floor(rect.width * dpr);
        const targetHeight = Math.floor(rect.height * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.scale(dpr, dpr);
        }

        // 1. CLEAR
        ctx.clearRect(0, 0, rect.width, rect.height);

        // If no clouds, we just cleared. Done.
        if (activeClouds.length === 0) return;

        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleLogicalRange();
        if (!visibleRange) return;

        // Clip to Chart Area (exclude Price Scale)
        const plotWidth = timeScale.width();
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, plotWidth, rect.height);
        ctx.clip();

        // Get visible time range with generous padding to prevent "Pop-in"
        const leftTime = timeScale.coordinateToTime(0);
        const rightTime = timeScale.coordinateToTime(plotWidth);

        const visibleFrom = leftTime || 0;
        const visibleTo = rightTime || (Date.now() / 1000 + 86400 * 365);
        const padding = (visibleTo - visibleFrom || 1000) * 0.5;

        const visibleClouds = activeClouds.filter(cloud => {
            return cloud.time >= (visibleFrom - padding) && cloud.time <= (visibleTo + padding);
        });

        if (visibleClouds.length === 0) {
            ctx.restore();
            return;
        }

        // Sort by time
        visibleClouds.sort((a, b) => a.time - b.time);

        // Group by trend segments with GAP-FILLER logic
        const segments = [];
        let currentSegment = [];
        let currentColor = null;

        visibleClouds.forEach((point, idx) => {
            if (point.color !== currentColor) {
                if (currentSegment.length > 0) {
                    // Close the gap: Add the flip point to the PREVIOUS segment too
                    currentSegment.push(point);
                    segments.push({ color: currentColor, points: [...currentSegment] });
                }
                currentSegment = [point];
                currentColor = point.color;
            } else {
                currentSegment.push(point);
            }
        });
        if (currentSegment.length > 0) segments.push({ color: currentColor, points: currentSegment });

        // Draw segments
        segments.forEach(segment => {
            if (segment.points.length < 2) return;

            const coords = [];
            segment.points.forEach(p => {
                const x = timeScale.timeToCoordinate(p.time);
                const y1 = series.priceToCoordinate(p.y1);
                const y2 = series.priceToCoordinate(p.y2);

                // Use exact coordinates (no Math.round) for pixel-perfect alignment with chart series
                if (x !== null && y1 !== null && y2 !== null) {
                    coords.push({ x, y1, y2 });
                }
            });

            if (coords.length < 2) return;

            ctx.beginPath();

            // 1. Draw Top Edge (Forward)
            ctx.moveTo(coords[0].x, coords[0].y1);
            for (let i = 1; i < coords.length; i++) {
                // Bezier Smoothing for "Smooth" look, but anchored to points
                const prev = coords[i - 1];
                const curr = coords[i];
                const cp1x = (prev.x + curr.x) / 2;
                ctx.bezierCurveTo(cp1x, prev.y1, cp1x, curr.y1, curr.x, curr.y1);
            }

            // 2. Draw Bottom Edge (Backward)
            ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y2);
            for (let i = coords.length - 2; i >= 0; i--) {
                const prev = coords[i + 1];
                const curr = coords[i];
                const cp1x = (prev.x + curr.x) / 2;
                ctx.bezierCurveTo(cp1x, prev.y2, cp1x, curr.y2, curr.x, curr.y2);
            }

            ctx.closePath();

            // Styling
            const isGreen = segment.color.includes('16, 185, 129');

            // Create a subtle gradient for "Premium" feel
            const yMin = Math.min(...coords.map(c => Math.min(c.y1, c.y2)));
            const yMax = Math.max(...coords.map(c => Math.max(c.y1, c.y2)));
            const grad = ctx.createLinearGradient(0, yMin, 0, yMax);

            if (isGreen) {
                grad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
                grad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
            } else {
                grad.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
                grad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
            }

            ctx.fillStyle = grad;
            ctx.fill();
        });

        ctx.restore();
    }, [activeClouds, chartRef, seriesRef]);

    // Start/Stop rendering
    useEffect(() => {
        if (!canvasRef.current || !chartRef.current || !seriesRef.current || activeClouds.length === 0) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        // Subscribe to chart events
        const chart = chartRef.current;
        const timeScale = chart.timeScale();

        const handleVisibleRangeChange = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            animationFrameRef.current = requestAnimationFrame(renderClouds);
        };

        timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
        timeScale.subscribeSizeChange(handleVisibleRangeChange);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (chart && chart.timeScale) {
                chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
                chart.timeScale().unsubscribeSizeChange(handleVisibleRangeChange);
            }
        };
    }, [activeClouds, chartRef, seriesRef, renderClouds]);

    // Manual Signal Panel State
    const [panelConfig, setPanelConfig] = useState({ show: false, side: 'BUY' });

    const openPanel = (side) => {
        setPanelConfig({ show: true, side });
    };

    return (
        <>
            {/* MANUAL SIGNAL PANEL OVERLAY */}
            {panelConfig.show && (
                <div className="absolute top-16 left-16 z-[60]">
                    <ManualSignalPanel
                        currentSymbol={symbol?.symbol}
                        currentPrice={panelConfig.side === 'BUY' ? symbol?.ask : symbol?.bid}
                        currentSegment={symbol?.segment}
                        initialSide={panelConfig.side}
                        onClose={() => setPanelConfig({ ...panelConfig, show: false })}
                    />
                </div>
            )}

            {/* SMOOTH CLOUD CANVAS */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                style={{
                    mixBlendMode: 'multiply',
                    willChange: 'transform'
                }}
            />

            {/* OVERLAY: Legend & Controls */}
            <div className="absolute top-0 left-0 p-3 z-50 flex flex-col gap-3 pointer-events-none select-none">
                {/* Symbol Header Line */}
                <div className="flex items-center gap-2 font-sans bg-background/50 backdrop-blur-sm p-1 rounded pointer-events-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    <span className="text-sm font-bold text-foreground font-sans">
                        {symbol?.symbol?.toUpperCase() || 'CRUDEOIL'}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">· {timeframe === 'W' ? '1W' : (timeframe === 'M' ? '1M' : (timeframe === 'D' ? '1D' : (timeframe === '60' ? '1h' : timeframe + 'm')))} ·</span>
                    <span className="text-xs text-muted-foreground font-medium">{symbol?.exchange || 'MCX'}</span>

                    {/* OHLC Stats */}
                    <div className="flex items-center gap-2 ml-4 text-[11px] font-mono">
                        <span className={legend.color}>O<span className="text-muted-foreground ml-0.5">{formatPrice(legend.open, symbol?.symbol)}</span></span>
                        <span className={legend.color}>H<span className="text-muted-foreground ml-0.5">{formatPrice(legend.high, symbol?.symbol)}</span></span>
                        <span className={legend.color}>L<span className="text-muted-foreground ml-0.5">{formatPrice(legend.low, symbol?.symbol)}</span></span>
                        <span className={legend.color}>C<span className="text-muted-foreground ml-0.5">{formatPrice(legend.close, symbol?.symbol)}</span></span>
                        <span className={`${legend.color} ml-1`}>
                            {legend.change > 0 ? '+' : ''}{formatPrice(legend.change, symbol?.symbol)} ({legend.change > 0 ? '+' : ''}{legend.percent.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="flex items-start gap-2 pointer-events-auto">
                    {(() => {
                        const price = parseFloat(symbol?.price || symbol?.lastPrice || 0);
                        const bid = parseFloat(symbol?.bid || 0);
                        const ask = parseFloat(symbol?.ask || 0);

                        const finalBid = bid > 0 ? bid : price;
                        const finalAsk = ask > 0 ? ask : price;
                        const hasData = finalBid > 0 && finalAsk > 0;
                        const spread = hasData ? (finalAsk - finalBid) : 0;
                        const spreadDisplay = hasData ? spread.toFixed(price < 10 ? 5 : 2) : '-.--';

                        const isIndex = symbol?.segment === 'INDICES' ||
                            symbol?.symbol?.includes('-INDEX') ||
                            symbol?.symbol?.includes('NIFTY') ||
                            symbol?.symbol?.includes('SENSEX') ||
                            symbol?.symbol?.includes('BANKEX');

                        if (isIndex) return null;

                        return (
                            <>
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); openPanel('SELL'); }}
                                    className="flex flex-col bg-background/90 border border-destructive/50 rounded hover:bg-destructive/10 transition group/sell min-w-[70px]"
                                >
                                    <div className="px-2 py-0.5 text-[10px] font-bold text-destructive border-b border-destructive/20 w-full text-center">
                                        {hasData ? formatPrice(finalBid, symbol?.symbol) : '-.--'}
                                    </div>
                                    <div className="px-2 py-0.5 text-xs font-bold text-destructive w-full text-center group-hover/sell:scale-105 transition">
                                        SELL
                                    </div>
                                </button>

                                <div className="flex flex-col items-center justify-center bg-background/90 border border-border/50 rounded min-w-[50px] h-[34px] self-stretch px-1">
                                    <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider leading-none mb-0.5">Spread</span>
                                    <span className={`text-[11px] font-mono font-bold leading-none ${spread > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {spreadDisplay}
                                    </span>
                                </div>

                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); openPanel('BUY'); }}
                                    className="flex flex-col bg-background/90 border border-blue-500/50 rounded hover:bg-blue-500/10 transition group/buy min-w-[70px]"
                                >
                                    <div className="px-2 py-0.5 text-[10px] font-bold text-blue-500 border-b border-blue-500/20 w-full text-center">
                                        {hasData ? formatPrice(finalAsk, symbol?.symbol) : '-.--'}
                                    </div>
                                    <div className="px-2 py-0.5 text-xs font-bold text-blue-500 w-full text-center group-hover/buy:scale-105 transition">
                                        BUY
                                    </div>
                                </button>
                            </>
                        );
                    })()}
                </div>

                {/* Price Info / Legend */}
                <div className="flex flex-col gap-0.5 mt-2 text-[10px] font-sans font-medium text-muted-foreground/80 pointer-events-auto">
                    {/* Volume */}
                    {showVolume && (
                        <div className="flex items-center gap-2 group cursor-default">
                            <span className="text-[#22ab94] font-semibold">Vol</span>
                            <span className="text-[#22ab94]">
                                {(() => {
                                    const val = legend.volume;
                                    if (val === undefined || val === null || val === '') return '---';
                                    const v = parseFloat(val);
                                    if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
                                    if (v >= 1000) return (v / 1000).toFixed(2) + 'K';
                                    if (v < 1) return v.toFixed(5);
                                    if (v < 10) return v.toFixed(4);
                                    if (v < 100) return v.toFixed(2);
                                    return v.toFixed(0);
                                })()}
                            </span>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onRemoveIndicator('VOLUME_ID'); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive p-0.5 cursor-pointer"
                                title="Hide Volume"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    )}

                    {/* Active Indicators */}
                    {activeIndicators && activeIndicators.map(ind => (
                        <div key={ind.uuid} className="flex items-center gap-2 group cursor-default">
                            <div className="flex items-center gap-1">
                                <Activity size={10} style={{ color: ind.color }} />
                                <span style={{ color: ind.color }} className="font-semibold">{ind.id} {ind.period}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); onEditIndicator(ind); }}
                                    className="hover:text-foreground transition p-0.5 cursor-pointer"
                                    title="Settings"
                                >
                                    <Settings size={10} />
                                </button>
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); onRemoveIndicator(ind.uuid); }}
                                    className="hover:text-destructive transition p-0.5 cursor-pointer"
                                    title="Remove"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation Toolbar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300 p-4">
                <div className="flex items-center shadow-lg bg-background rounded-lg overflow-hidden border border-border/50">
                    <button onClick={onZoomOut} className="p-2 hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center w-8 h-8">
                        <Minus size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-border/50" />
                    <button onClick={onZoomIn} className="p-2 hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center w-8 h-8">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex items-center shadow-lg bg-background rounded-lg overflow-hidden border border-border/50">
                    <button onClick={onScrollLeft} className="p-2 hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center w-8 h-8">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-border/50" />
                    <button onClick={onScrollRight} className="p-2 hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center w-8 h-8">
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className="flex items-center shadow-lg bg-background rounded-lg overflow-hidden border border-border/50">
                    <button onClick={onReset} className="p-2 hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center w-8 h-8">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Scroll to End Button */}
            <div className="absolute bottom-6 right-16 z-20 flex items-center pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300 p-2">
                <div className="flex items-center shadow-lg bg-background rounded-lg overflow-hidden border border-border/50">
                    <button onClick={onScrollToEnd} className="p-2 hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center w-8 h-8">
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChartOverlay;