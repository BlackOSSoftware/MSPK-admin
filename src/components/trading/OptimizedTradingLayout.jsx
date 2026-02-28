import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import TradingHeader from './TradingHeader';
import TradingToolbar from './TradingToolbar';
import TradingChartGL from './TradingChartGL'; // Using our new GL chart!
import chartCache from '../../utils/ChartDataCache'; // Prefetching
import { getSymbols, updateSymbol } from '../../api/market.api';
import instancePool from '../../utils/ChartInstancePool';
import prefetcher from '../../utils/PredictivePrefetcher';

// Optimizations
import { useThrottledState } from '../../hooks/useThrottledState';
import { useSocketSubscription } from '../../hooks/useSocketSubscription';
import { withPerformanceMonitor } from '../../utils/performanceHOC';
import VirtualizedWatchlist from './VirtualizedWatchlist';

// Lazy Loaded Modals
const SymbolSearchModal = React.lazy(() => import('./SymbolSearchModal'));
const IndicatorsModal = React.lazy(() => import('./IndicatorsModal'));
const IndicatorSettingsModal = React.lazy(() => import('./IndicatorSettingsModal'));
// const TradingChartSettings = React.lazy(() => import('./TradingChartSettings')); // If huge
const SnapshotModal = React.lazy(() => import('./SnapshotModal'));

const OptimizedTradingLayout = () => {
    // -- Global State --
    const [searchParams] = useSearchParams();
    const [symbols, setSymbols] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // -- Optimized Market Data --
    const [marketData, setMarketData] = useThrottledState({}, 15); // 15 FPS update for UI numbers is plenty

    // -- Layout State --
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [timeframe, setTimeframe] = useState(() => localStorage.getItem('mspk_timeframe') || '5');
    const [chartType, setChartType] = useState(() => localStorage.getItem('mspk_chart_type') || 'candle');

    // -- Modal States --
    const [modals, setModals] = useState({
        search: false,
        indicators: false,
        settings: false,
        snapshot: false
    });

    const toggleModal = useCallback((name, isOpen) => {
        setModals(prev => ({ ...prev, [name]: isOpen }));
    }, []);

    // -- Initialization --
    useEffect(() => {
        const init = async () => {
            try {
                // ... fetch logic ...
                const data = await getSymbols();
                if (data && data.length > 0) {
                    setSymbols(data);
                    // Select first or url param
                    const urlSymbol = searchParams.get('symbol');
                    const initial = urlSymbol ? data.find(s => s.symbol === urlSymbol) : data[0];
                    setSelectedSymbol(initial || data[0]);
                }
            } catch (e) { console.error(e); } finally { setIsLoading(false); }
        };
        init();
    }, []);

    // -- Prefetching --
    useEffect(() => {
        if (selectedSymbol && symbols.length > 0) {
            chartCache.prefetch(selectedSymbol.symbol, symbols, timeframe);
        }
    }, [selectedSymbol?.symbol, symbols, timeframe]);

    // -- Socket Optimization --
    const handleTick = useCallback((data) => {
        // Data is single tick object or array
        const tick = Array.isArray(data) ? data[0] : data;
        if (!tick) return;

        setMarketData(prev => {
            // Immutable update only if changed significantly? 
            // ThrottledState handles the frequency.
            return {
                ...prev,
                [tick.symbol]: {
                    price: tick.last_price,
                    change: tick.change, // Assuming tick has change calculated or we calc it
                    volume: tick.volume
                }
            };
        });
    }, [setMarketData]);

    const socketEvents = useMemo(() => ({
        'tick': handleTick,
        'price_update': handleTick
    }), [handleTick]);

    useSocketSubscription(socketEvents, []);
    // Note: useSocketSubscription handles 'on'/'off'. 
    // Subscription to *rooms* (emit('subscribe')) should be handled separately or inside the hook if expanded.
    // For now we assume the socket is auto-subscribed or we add an effect here:

    useEffect(() => {
        const { getSocket } = require('../../services/socket');
        const socket = getSocket();
        if (socket && symbols.length > 0) {
            symbols.forEach(s => socket.emit('subscribe', s.symbol));
        }
    }, [symbols]);

    // -- Prefetching (Predictive) --
    useEffect(() => {
        // Disabled aggressive pre-warm to prevent 429 Rate Limits
        // if (symbols.length > 0) {
        //     instancePool.preWarm(symbols); 
        // }
    }, [symbols]);

    // -- Handlers --
    const handleSymbolSelect = useCallback((sym) => {
        if (selectedSymbol?.symbol === sym.symbol) return;

        setSelectedSymbol(sym);

        // Predictive Logic
        prefetcher.track(sym.symbol);
        const nextCandidates = prefetcher.predict(sym.symbol, symbols);
        instancePool.backgroundWarm(nextCandidates);
    }, [selectedSymbol, symbols]);

    const handleRemoveSymbol = useCallback((symTicker) => {
        setSymbols(prev => prev.filter(s => s.symbol !== symTicker));
    }, []);

    // -- Render --
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-200 overflow-hidden">
            <TradingHeader />

            <div className="flex flex-1 overflow-hidden">
                <TradingToolbar />

                {/* Main Chart Area */}
                <div className="flex-1 relative flex flex-col min-w-0">
                    {/* Toolbar / Timeframe Selector Row (Simplified) */}
                    <div className="h-10 border-b border-gray-800 flex items-center px-2">
                        {/* Timeframe Selector Component would go here */}
                        <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="bg-gray-800 rounded p-1 text-xs">
                            <option value="1">1m</option>
                            <option value="5">5m</option>
                            <option value="15">15m</option>
                        </select>
                        <span className="ml-4 font-bold text-sm tracking-wider">{selectedSymbol?.symbol}</span>
                        <span className="ml-4 text-xs font-mono text-green-400">
                            {marketData[selectedSymbol?.symbol]?.price || '---'}
                        </span>
                    </div>

                    <div className="flex-1 relative">
                        {selectedSymbol && (
                            <TradingChartGL
                                symbol={selectedSymbol}
                                timeframe={timeframe}
                                chartType={chartType}
                            />
                        )}
                    </div>
                </div>

                {/* Right Sidebar (Virtual Watchlist) */}
                {rightSidebarOpen && (
                    <div className="w-[300px] border-l border-gray-800 flex flex-col bg-gray-900">
                        {/* Tabs (Watchlist/Alerts) */}
                        <div className="h-full flex flex-col">
                            <div className="p-2 font-bold text-xs uppercase tracking-wider text-gray-500">Watchlist</div>
                            <VirtualizedWatchlist
                                symbols={symbols}
                                marketData={marketData}
                                selectedSymbol={selectedSymbol}
                                onSelect={handleSymbolSelect}
                                onRemove={handleRemoveSymbol}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Modals (Lazy) */}
            <Suspense fallback={null}>
                {modals.search && <SymbolSearchModal onClose={() => toggleModal('search', false)} />}
                {/* ... other modals */}
            </Suspense>
        </div>
    );
};

export default withPerformanceMonitor(OptimizedTradingLayout, 'TradingLayout');
