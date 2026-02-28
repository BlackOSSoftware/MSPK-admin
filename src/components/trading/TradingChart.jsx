import React, { useState, useEffect } from 'react';
import ChartOverlay from './ChartOverlay';
import { useChartInit } from './hooks/useChartInit';
import { useChartData } from './hooks/useChartData';
import { useChartRealtime } from './hooks/useChartRealtime';
import { useChartSignals } from './hooks/useChartSignals';
import { useChartCrosshair } from './hooks/useChartCrosshair';
import { useChartIndicators } from './hooks/useChartIndicators';
import { useChartDrawings } from './hooks/useChartDrawings';
import { useChartMarkers } from './hooks/useChartMarkers';
import '../../styles/tradingview.css';

const TradingChart = ({
    symbol,
    latestTick,
    activeSignals,
    signalMarkers = [],
    onQuickSignal,
    timeframe = '5',
    chartType = 'candle',
    onChartTypeChange,
    activeIndicators = [],
    showVolume = true,
    onRemoveIndicator,
    onEditIndicator,

    activeTool = 'crosshair',
    clearDrawingsToggle,
    chartSettings,
    snapshotTrigger,
    onSnapshotCaptured }) => {

    const [drawings, setDrawings] = useState([]); // { price, color, title }
    const [indicatorMarkers, setIndicatorMarkers] = useState([]); // Markers from indicators like HHLL
    const [activeClouds, setActiveClouds] = useState([]); // Cloud fills for Supertrend

    // Legend State
    const [legend, setLegend] = useState({
        open: 0, high: 0, low: 0, close: 0,
        change: 0, percent: 0, color: 'text-foreground'
    });

    // Snapshot Effect
    useEffect(() => {
        if (!snapshotTrigger || !chartRef.current) return;
        try {
            const canvas = chartRef.current.takeScreenshot();

            // Create a temporary canvas to add watermark
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Dimensions
                const wmHeight = 60;
                tempCanvas.width = img.width;
                tempCanvas.height = img.height + wmHeight;

                // 1. Fill Background (Prevent Transparency issues)
                ctx.fillStyle = '#0f1115'; // Deep dark background (matching app theme)
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                // 2. Draw Chart
                ctx.drawImage(img, 0, 0);

                // 3. Draw Footer Background (Distinct from chart)
                ctx.fillStyle = '#1e222d'; // Dark background for footer
                ctx.fillRect(0, img.height, tempCanvas.width, wmHeight);

                // Draw Top Border for Footer
                ctx.fillStyle = '#333';
                ctx.fillRect(0, img.height, tempCanvas.width, 1);

                // 4. Draw Logo
                const logo = new Image();
                logo.onload = () => {
                    const logoHeight = 40;
                    const logoWidth = (logo.width / logo.height) * logoHeight;
                    ctx.drawImage(logo, 20, img.height + 10, logoWidth, logoHeight);

                    // 5. Draw Text - Left (Branding) - Shifted right for logo
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillStyle = '#3b82f6'; // Primary Color
                    ctx.fillText('MSPK TRADE SOLUTIONS', 20 + logoWidth + 15, img.height + 38);

                    // 6. Draw Text - Right (Info)
                    ctx.font = '14px sans-serif';
                    ctx.fillStyle = '#94a3b8'; // Muted
                    ctx.textAlign = 'right';
                    const dateStr = new Date().toLocaleString();
                    const symbolStr = symbol?.symbol?.replace('NSE:', '') || 'SYMBOL';
                    ctx.fillText(`${symbolStr} • ${timeframe}m • ${dateStr}`, tempCanvas.width - 20, img.height + 35);

                    const finalUrl = tempCanvas.toDataURL('image/png');
                    if (onSnapshotCaptured) {
                        onSnapshotCaptured(finalUrl);
                    }
                };
                logo.src = '/logo.jpeg';
            };
            img.src = canvas.toDataURL('image/png');

        } catch (e) {
            console.error("Snapshot failed", e);
        }
    }, [snapshotTrigger]);

    // 1. Init Chart
    const { chartContainerRef, chartRef, seriesRef, volSeriesRef } = useChartInit({ activeTool });

    // 2. Data & History
    const {
        isHistoryLoaded,
        lastCandleRef,
        lastHeikenRef,
        currentRawCandleRef,
        currentDataRef,
        allHistoryRef,
        dataVersion,
        isLoading
    } = useChartData({
        symbol,
        timeframe,
        chartType,
        chartRef,
        seriesRef,
        volSeriesRef
    });

    // 3. Realtime
    useChartRealtime({
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
        onUpdateLegend: () => { }, // Legend updates internally via crosshair
        isHistoryLoaded
    });

    // 4. Signals
    useChartSignals({ symbol, activeSignals, chartRef, seriesRef, activeIndicators, isHistoryLoaded });

    // 5. Crosshair (Exposing ref for Drawings)
    const { lastCrosshairRef } = useChartCrosshair({
        chartRef,
        seriesRef,
        volSeriesRef,
        setLegend,
        lastCandleRef
    });

    // 6. Indicators
    useChartIndicators({
        chartRef,
        seriesRef,
        activeIndicators,
        currentDataRef,
        latestTick,
        chartType,
        isHistoryLoaded,
        dataVersion,
        onUpdateMarkers: (data) => {
            // Handle hybrid data object (markers + clouds)
            if (data && data.clouds !== undefined) {
                setIndicatorMarkers(data.markers || []);
                setActiveClouds(data.clouds || []);
            } else {
                // Backward compatibility (if just array)
                setIndicatorMarkers(data || []);
            }
        }
    });

    // 7. Markers
    useChartMarkers({
        chartRef,
        seriesRef,
        signalMarkers,
        indicatorMarkers,
        symbol,
        timeframe,
        onQuickSignal
    });

    // 8. Drawings
    const { handleChartClick } = useChartDrawings({
        chartRef,
        seriesRef,
        drawings,
        setDrawings,
        activeTool,
        clearDrawingsToggle,
        lastCrosshairRef
    });

    // --- EFFECTS ---

    useEffect(() => {
        if (symbol) {
            // Reset UI states to prevent leaks from previous symbol
            setIndicatorMarkers([]);
            setActiveClouds([]);

            const price = symbol.price || symbol.lastPrice || 0;
            setLegend({
                open: symbol.open || price,
                high: symbol.high || price,
                low: symbol.low || price,
                close: price,
                change: symbol.change || 0,
                percent: symbol.changePercent || 0,
                color: (symbol.change || 0) >= 0 ? 'text-[#22ab94]' : 'text-[#f23645]',
                volume: symbol.volume || 0
            });
        }
    }, [symbol?.symbol]);

    // Apply Global Chart Settings
    useEffect(() => {
        if (!chartRef.current || !seriesRef.current || !chartSettings) return;

        // 1. Symbol (Series) Colors
        seriesRef.current.applyOptions({
            upColor: chartSettings.symbol.upColor,
            downColor: chartSettings.symbol.downColor,
            borderUpColor: chartSettings.symbol.borderUpColor,
            borderDownColor: chartSettings.symbol.borderDownColor,
            wickUpColor: chartSettings.symbol.wickUpColor,
            wickDownColor: chartSettings.symbol.wickDownColor,
        });

        // 2. Canvas (Grid & Background)
        chartRef.current.applyOptions({
            grid: {
                vertLines: { visible: chartSettings.canvas.gridVertLines },
                horzLines: { visible: chartSettings.canvas.gridHorzLines },
            },
            layout: {
                background: {
                    type: chartSettings.canvas.backgroundType === 'gradient' ? 'VerticalGradient' : 'Solid',
                    color: chartSettings.canvas.backgroundColor,
                },
                textColor: '#d1d5db',
            }
        });

        if (chartSettings.canvas.backgroundType === 'solid') {
            chartRef.current.applyOptions({
                layout: { background: { type: 'Solid', color: chartSettings.canvas.backgroundColor } }
            });
        }

        // 3. Scales / Series Options
        seriesRef.current.applyOptions({
            lastValueVisible: chartSettings.scales.showLastPrice,
            priceLineVisible: chartSettings.scales.showLastPrice,
        });

        chartRef.current.applyOptions({
            crosshair: {
                mode: 1, // Normal
                vertLine: { labelVisible: true },
                horzLine: { labelVisible: chartSettings.scales.showLastPrice }
            },
            // FORCE BORDERS OFF
            timeScale: { borderVisible: false, borderColor: 'transparent' },
            rightPriceScale: { borderVisible: false, borderColor: 'transparent' }
        });

    }, [chartSettings]);

    // Toggle Volume Visibility
    useEffect(() => {
        if (volSeriesRef.current) {
            volSeriesRef.current.applyOptions({ visible: showVolume });
        }
    }, [showVolume]);

    // Load Drawings
    useEffect(() => {
        if (!symbol?.symbol) return;
        const key = `mspk_drawings_${symbol.symbol}`;
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                setDrawings(JSON.parse(saved));
            } else {
                setDrawings([]);
            }
        } catch (e) {
            console.error("Failed to load drawings", e);
            setDrawings([]);
        }
    }, [symbol?.symbol]);

    // Save Drawings
    useEffect(() => {
        if (!symbol?.symbol) return;
        const key = `mspk_drawings_${symbol.symbol}`;
        localStorage.setItem(key, JSON.stringify(drawings));
    }, [drawings, symbol?.symbol]);

    // Clear drawings effect
    useEffect(() => {
        if (clearDrawingsToggle) {
            setDrawings([]);
            if (symbol?.symbol) {
                localStorage.removeItem(`mspk_drawings_${symbol.symbol}`);
            }
        }
    }, [clearDrawingsToggle]);

    // --- NAVIGATION HELPERS ---
    const handleZoomIn = () => {
        if (!chartRef.current) return;
        const timeScale = chartRef.current.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
            const span = range.to - range.from;
            const center = (range.from + range.to) / 2;
            timeScale.setVisibleLogicalRange({ from: center - span * 0.4, to: center + span * 0.4 });
        }
    };

    const handleZoomOut = () => {
        if (!chartRef.current) return;
        const timeScale = chartRef.current.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
            const span = range.to - range.from;
            const center = (range.from + range.to) / 2;
            timeScale.setVisibleLogicalRange({ from: center - span * 0.625, to: center + span * 0.625 });
        }
    };

    const handleScrollLeft = () => {
        if (!chartRef.current) return;
        const timeScale = chartRef.current.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
            const shift = (range.to - range.from) * 0.2;
            timeScale.setVisibleLogicalRange({ from: range.from - shift, to: range.to - shift });
        }
    };

    const handleScrollRight = () => {
        if (!chartRef.current) return;
        const timeScale = chartRef.current.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
            const shift = (range.to - range.from) * 0.2;
            timeScale.setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift });
        }
    };

    const handleReset = () => {
        if (!chartRef.current) return;
        chartRef.current.timeScale().scrollToRealTime();
        chartRef.current.priceScale('right').applyOptions({ autoScale: true });
    };

    const handleScrollToEnd = () => {
        if (!chartRef.current) return;
        chartRef.current.timeScale().scrollToRealTime();
    };

    // Dynamic Precision Adjustment
    // Dynamic Precision Adjustment
    useEffect(() => {
        if (!seriesRef.current || !symbol) return;

        let precision = 2;
        let minMove = 0.01;

        // 1. Priority: Explicit Precision from Symbol Data
        if (symbol.precision !== undefined && symbol.precision !== null) {
            precision = parseInt(symbol.precision);
            minMove = 1 / Math.pow(10, precision);
        }
        // 2. Heuristic: Price Magnitude based (if no explicit precision)
        else {
            const price = parseFloat(symbol.lastPrice || symbol.price || 0);

            if (price > 10000) {
                // High value (Indices, Commodities like Silver/Gold usually)
                // Keep 2 decimals standard, or even 0 depending on asset, but 2 is safe.
                precision = 2;
                minMove = 0.05;
            } else if (price > 0 && price < 2) {
                // Low Value / Forex / Penny
                precision = 4;
                minMove = 0.0001;
            } else {
                // Standard Stocks
                precision = 2;
                minMove = 0.05;
            }

            // Override for known types if needed
            const isForex = symbol.exchange === 'FOREX' || symbol.symbol?.includes('USD');
            const isCDS = symbol.symbol?.includes('USDINR') || symbol.symbol?.includes('JPYINR');

            if (isCDS) {
                precision = 4;
                minMove = 0.0025;
            } else if (isForex && price < 500) {
                // Only treat as high-precision forex if price is small (e.g. EURUSD 1.05)
                // Start with 5 for standard Forex
                precision = 5;
                minMove = 0.00001;
            }
        }

        seriesRef.current.applyOptions({
            priceFormat: {
                type: 'price',
                precision: precision,
                minMove: minMove,
            },
        });

    }, [symbol?.symbol, symbol?.price]); // Re-run if symbol or PRICE changes (for magnitude check)

    return (
        <div className="relative w-full h-full group">
            {/* SKELETON LOADER OVERLAY */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        {/* Simple Chart Skeleton Shapes - Themed */}
                        <div className="flex items-end gap-1 h-32">
                            <div className="w-3 h-12 bg-primary/20 rounded-t"></div>
                            <div className="w-3 h-20 bg-primary/10 rounded-t"></div>
                            <div className="w-3 h-16 bg-primary/30 rounded-t"></div>
                            <div className="w-3 h-24 bg-primary/5 rounded-t"></div>
                            <div className="w-3 h-10 bg-primary/15 rounded-t"></div>
                        </div>
                        <div className="text-muted-foreground text-sm font-semibold tracking-wide">LOADING {symbol?.symbol || 'CHART'}...</div>
                    </div>
                </div>
            )}

            <div
                ref={chartContainerRef}
                className="w-full h-full"
                onClick={handleChartClick}
                style={{ backgroundColor: chartSettings?.canvas?.backgroundColor || 'transparent' }}
            />

            <ChartOverlay
                symbol={symbol}
                timeframe={timeframe}
                legend={legend}
                activeIndicators={activeIndicators}
                showVolume={showVolume}
                onRemoveIndicator={onRemoveIndicator}
                onEditIndicator={onEditIndicator}
                onQuickSignal={onQuickSignal}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onScrollLeft={handleScrollLeft}
                onScrollRight={handleScrollRight}
                onReset={handleReset}
                onScrollToEnd={handleScrollToEnd}
                activeClouds={activeClouds} // Cloud Fill Data
                chartRef={chartRef}         // For Time Scale Coords
                seriesRef={seriesRef}       // For Price Scale Coords
            />
        </div>
    );
};

export default React.memo(TradingChart, (prevProps, nextProps) => {
    return (
        prevProps.symbol?.symbol === nextProps.symbol?.symbol &&
        prevProps.timeframe === nextProps.timeframe &&
        prevProps.chartType === nextProps.chartType &&
        prevProps.showVolume === nextProps.showVolume &&
        prevProps.activeIndicators.length === nextProps.activeIndicators.length &&
        JSON.stringify(prevProps.activeIndicators) === JSON.stringify(nextProps.activeIndicators) &&
        prevProps.activeSignals?.length === nextProps.activeSignals?.length &&
        prevProps.signalMarkers?.length === nextProps.signalMarkers?.length &&
        prevProps.latestTick === nextProps.latestTick
    );
});
