import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TradingHeader from './TradingHeader';
import TradingToolbar from './TradingToolbar';
import TradingChart from './TradingChart';
import TradingChartGL from './TradingChartGL';
import TradingWatchlist from './TradingWatchlist';
import QuickSignalModal from './QuickSignalModal';
import SymbolSearchModal from './SymbolSearchModal';
import IndicatorsModal from './IndicatorsModal';
import IndicatorSettingsModal from './IndicatorSettingsModal';
import TradingChartSettings from './TradingChartSettings';
import SnapshotModal from './SnapshotModal';
import SignalCardsPanel from './SignalCardsPanel';
import Button from '../ui/Button';
import { socket } from '../../api/socket';
import { getSymbols, updateSymbol } from '../../api/market.api';
import { mapStrategyToIndicators } from '../../utils/strategyMapping';
import { getSegmentGroup } from '../../utils/segmentGroups';
import chartCache from '../../utils/ChartDataCache';
import { matchesSignalTimeframe, normalizeSignalTimeframe, snapSignalTimeToResolution } from '../../utils/timeframe';

const ACTIVE_SIGNAL_STATUSES = new Set(['ACTIVE', 'ENTRY_PENDING']);

const getSignalEventTime = (signal) => signal?.signalTime || signal?.createdAt || signal?.timestamp || null;

const buildSignalMarker = (signal, resolution) => {
    const snappedTime = snapSignalTimeToResolution(getSignalEventTime(signal), resolution);
    if (snappedTime === null) return null;

    return {
        time: snappedTime,
        position: signal.type === 'BUY' ? 'belowBar' : 'aboveBar',
        color: signal.type === 'BUY' ? '#10b981' : '#ef4444',
        shape: signal.type === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${signal.type} `,
        size: 2,
        strategyId: signal.strategyId ? String(signal.strategyId) : 'MANUAL'
    };
};

const getSignalIdentity = (signal) =>
    String(
        signal?.id ||
        signal?._id ||
        signal?.uniqueId ||
        [
            signal?.symbol || '',
            normalizeSignalTimeframe(signal?.timeframe) || '',
            signal?.type || '',
            getSignalEventTime(signal) || ''
        ].join('|')
    );

const upsertSignal = (collection, signal) => {
    const nextIdentity = getSignalIdentity(signal);
    const nextIndex = collection.findIndex((item) => getSignalIdentity(item) === nextIdentity);

    if (nextIndex === -1) {
        return [...collection, signal];
    }

    const nextCollection = [...collection];
    nextCollection[nextIndex] = { ...nextCollection[nextIndex], ...signal };
    return nextCollection;
};

const MULTI_TIMEFRAME_WINDOWS = [
    { value: '5', label: '5m', description: 'Fast Execution' },
    { value: '15', label: '15m', description: 'Trend Confirmation' },
    { value: '60', label: '1h', description: 'Higher Timeframe Bias' }
];

const MULTI_TIMEFRAME_WINDOW_SET = new Set(MULTI_TIMEFRAME_WINDOWS.map((item) => item.value));

const resolveSignalStrategyId = (signal) => signal?.strategyId ? String(signal.strategyId) : 'MANUAL';

const TradingLayout = ({ hideCharts = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    // -- Global State --
    const [symbols, setSymbols] = useState([]); // Currently active list (Watchlist)
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // -- Data Feed State --
    const [marketData, setMarketData] = useState({});

    // -- Layout State --
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [timeframe, setTimeframe] = useState(() => {
        const saved = localStorage.getItem('mspk_timeframe');
        return MULTI_TIMEFRAME_WINDOW_SET.has(saved) ? saved : '5';
    });
    const [chartType, setChartType] = useState(() => localStorage.getItem('mspk_chart_type') || 'candle');

    // Load Indicators from Storage
    const [activeIndicators, setActiveIndicators] = useState(() => {
        try {
            const saved = localStorage.getItem('mspk_active_indicators');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [showVolume, setShowVolume] = useState(() => {
        const saved = localStorage.getItem('mspk_show_volume');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [clearToggle, setClearToggle] = useState(0);
    const [snapshotTrigger, setSnapshotTrigger] = useState({ id: 0, timeframe: '5' });

    // -- Signals State --
    const [symbolSignals, setSymbolSignals] = useState([]);

    // -- Quick Signal State --
    const [quickSignal, setQuickSignal] = useState({ isOpen: false, type: 'BUY', timeframe: '5' });

    // -- Search Modal State --
    const [searchModal, setSearchModal] = useState({ isOpen: false, mode: 'VIEW' });
    const [indicatorsModalOpen, setIndicatorsModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [snapshotModal, setSnapshotModal] = useState({ isOpen: false, image: null });
    const [editingIndicator, setEditingIndicator] = useState(null);

    // -- Bot State --
    const [activeBot, setActiveBot] = useState(null);
    const [strategyFilter, setStrategyFilter] = useState('ALL'); // 'ALL' or strategyId

    // -- Resizable Sidebar State --
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('mspk_sidebar_width');
        return saved ? parseInt(saved) : 300;
    });
    const [isResizing, setIsResizing] = useState(false);

    // Persist Sidebar
    useEffect(() => {
        localStorage.setItem('mspk_sidebar_width', sidebarWidth);
    }, [sidebarWidth]);

    const [activeTool, setActiveTool] = useState(() => localStorage.getItem('mspk_active_tool') || 'crosshair');

    // Persist Tool
    useEffect(() => {
        localStorage.setItem('mspk_active_tool', activeTool);
    }, [activeTool]);

    // -- Chart Settings --
    const defaultChartSettings = {
        symbol: {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
            realPrices: false,
        },
        canvas: {
            backgroundType: 'solid',
            backgroundColor: 'transparent',
            gridVertLines: true,
            gridHorzLines: true,
        },
        scales: {
            showLastPrice: true,
            showSymbolName: true,
        }
    };

    const [chartSettings, setChartSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('mspk_chart_settings');
            return saved ? { ...defaultChartSettings, ...JSON.parse(saved) } : defaultChartSettings;
        } catch (e) { return defaultChartSettings; }
    });

    // -- Persistence Effects --
    useEffect(() => {
        localStorage.setItem('mspk_timeframe', timeframe);
    }, [timeframe]);

    useEffect(() => {
        localStorage.setItem('mspk_chart_type', chartType);
    }, [chartType]);

    useEffect(() => {
        localStorage.setItem('mspk_active_indicators', JSON.stringify(activeIndicators));
    }, [activeIndicators]);

    useEffect(() => {
        localStorage.setItem('mspk_show_volume', JSON.stringify(showVolume));
    }, [showVolume]);

    useEffect(() => {
        localStorage.setItem('mspk_chart_settings', JSON.stringify(chartSettings));
    }, [chartSettings]);

    // -- Prefetch Adjacent Symbols --
    useEffect(() => {
        if (selectedSymbol && symbols.length > 0) {
            chartCache.prefetch(selectedSymbol.symbol, symbols, timeframe);
        }
    }, [selectedSymbol?.symbol, symbols, timeframe]);

    // -- Vertical Resizer State (Watchlist vs Signals) --
    const [watchlistHeight, setWatchlistHeight] = useState(() => {
        const saved = localStorage.getItem('mspk_watchlist_height');
        return saved ? parseFloat(saved) : 50;
    });
    const [isResizingVertical, setIsResizingVertical] = useState(false);
    const sidebarRef = React.useRef(null);

    useEffect(() => {
        localStorage.setItem('mspk_watchlist_height', watchlistHeight);
    }, [watchlistHeight]);

    const startResizingVertical = React.useCallback(() => {
        setIsResizingVertical(true);
    }, []);

    const stopResizingVertical = React.useCallback(() => {
        setIsResizingVertical(false);
    }, []);

    const resizeVertical = React.useCallback(
        (mouseMoveEvent) => {
            if (isResizingVertical && sidebarRef.current) {
                const sidebarRect = sidebarRef.current.getBoundingClientRect();
                const newHeight = mouseMoveEvent.clientY - sidebarRect.top;
                const totalHeight = sidebarRect.height;
                const percentage = (newHeight / totalHeight) * 100;

                // User requested full range "ekdum niche tak"
                if (percentage >= 0 && percentage <= 100) {
                    setWatchlistHeight(percentage);
                }
            }
        },
        [isResizingVertical]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resizeVertical);
        window.addEventListener("mouseup", stopResizingVertical);
        return () => {
            window.removeEventListener("mousemove", resizeVertical);
            window.removeEventListener("mouseup", stopResizingVertical);
        };
    }, [resizeVertical, stopResizingVertical]);

    const startResizing = React.useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback(
        (mouseMoveEvent) => {
            if (isResizing) {
                const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
                if (newWidth > 200 && newWidth < 600) { // Min 200px, Max 600px
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    // -- Watchlist Order Persistence --
    const [watchlistOrder, setWatchlistOrder] = useState(() => {
        try {
            const saved = localStorage.getItem('mspk_watchlist_order');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const loadWatchlist = React.useCallback(async () => {
        try {
            // Load ONLY watchlist symbols for the sidebar
            let raw = await getSymbols({ watchlist: 'true' });

            // Sort based on persisted order
            if (watchlistOrder.length > 0) {
                raw.sort((a, b) => {
                    const idxA = watchlistOrder.indexOf(a.symbol);
                    const idxB = watchlistOrder.indexOf(b.symbol);
                    // Items in order list come first, sorted by index
                    // New items (not in list) go to bottom
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                });
            }

            setSymbols(raw);

            // Group for Watchlist
            const grouped = raw.reduce((acc, s) => {
                const cat = getSegmentGroup(s);
                if (!acc[cat]) acc[cat] = [];

                const price = parseFloat(s.lastPrice || 0);
                // Priority: prevClose -> ohlc.close -> closePrice -> price
                const prevClose = parseFloat(s.prevClose || s.ohlc?.close || s.closePrice || price);

                let change = parseFloat(s.change || 0);
                let changePercent = parseFloat(s.changePercent || 0);

                // If API didn't provide pre-calculated change, calculate it manually
                if (change === 0 && changePercent === 0 && prevClose > 0 && price > 0) {
                    change = price - prevClose;
                    changePercent = ((change / prevClose) * 100);
                }

                acc[cat].push({
                    ...s,
                    price,
                    prevClose, // Store for socket updates
                    change: change,
                    changePercent: changePercent,
                    volume: parseFloat(s.volume || s.v || s.vol || s.total_volume || s.lastVolume || 0)
                });
                return acc;
            }, {});

            setMarketData(grouped);

            // If nothing selected yet, select first
            if (!selectedSymbol && raw.length > 0) setSelectedSymbol(raw[0]);
        } catch (e) {
            console.error("Failed to load symbols", e);
        }
    }, [watchlistOrder, selectedSymbol]);

    const handleWatchlistReorder = (newOrder) => {
        setWatchlistOrder(newOrder);
        localStorage.setItem('mspk_watchlist_order', JSON.stringify(newOrder));

        // Re-sort current marketData immediately for UI responsiveness
        setMarketData(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(cat => {
                next[cat].sort((a, b) => {
                    const idxA = newOrder.indexOf(a.symbol);
                    const idxB = newOrder.indexOf(b.symbol);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                });
            });
            return next;
        });
    };

    // -- Category Order Persistence --
    const [categoryOrder, setCategoryOrder] = useState(() => {
        try {
            const saved = localStorage.getItem('mspk_category_order');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const handleCategoryReorder = (newOrder) => {
        setCategoryOrder(newOrder);
        localStorage.setItem('mspk_category_order', JSON.stringify(newOrder));
    };

    // -- Watchlist Settings (Customization) --
    const [watchlistSettings, setWatchlistSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('mspk_watchlist_settings');
            return saved ? JSON.parse(saved) : {
                tableView: false, // Default to compact list view
                columns: {
                    last: true,
                    change: true,
                    changePercent: true,
                    volume: false,
                    extendedHours: false
                },
                show: {
                    logo: true,
                    ticker: true,
                    description: false
                }
            };
        } catch (e) {
            return {
                tableView: false,
                columns: { last: true, change: true, changePercent: true, volume: false, extendedHours: false },
                show: { logo: true, ticker: true, description: false }
            };
        }
    });

    useEffect(() => {
        localStorage.setItem('mspk_watchlist_settings', JSON.stringify(watchlistSettings));
    }, [watchlistSettings]);

    // 1. Initial Data Load
    useEffect(() => {
        const load = async () => {
            await loadWatchlist();
            setIsLoading(false);
        };
        load();
    }, [loadWatchlist]);

    useEffect(() => {
        const symbolParam = searchParams.get('symbol');
        const strategyParam = searchParams.get('strategyId');

        if (symbolParam) {
            const matchInWatchlist = symbols.find(s => s.symbol.toUpperCase() === symbolParam.toUpperCase());
            if (matchInWatchlist) {
                setSelectedSymbol(matchInWatchlist);
            } else {
                // Not in watchlist, fetch complete symbol info
                const fetchAndSelect = async () => {
                    try {
                        const res = await getSymbols({ search: symbolParam });
                        if (res && res.length > 0) {
                            // Find exact match
                            const exact = res.find(s => s.symbol.toUpperCase() === symbolParam.toUpperCase());
                            if (exact) setSelectedSymbol(exact);
                        }
                    } catch (e) { console.error("Link fetch failed", e); }
                };
                fetchAndSelect();
            }
        }

        if (strategyParam) {
            setStrategyFilter(strategyParam);
        }
    }, [searchParams, symbols]);

    // -- Helpers --
    const refreshSignals = React.useCallback(async () => {
        if (!selectedSymbol) return;
        try {
            const { fetchSignals } = await import('../../api/signals.api');
            const res = await fetchSignals({ symbol: selectedSymbol.symbol, limit: 120 });
            const signalsData = res.data?.results || res.results || (Array.isArray(res.data) ? res.data : []);
            setSymbolSignals(Array.isArray(signalsData) ? signalsData : []);
        } catch (error) {
            console.error("Failed to fetch signals", error);
            setSymbolSignals([]);
        }
    }, [selectedSymbol]);

    // -- Strategies State --
    const [symbolStrategies, setSymbolStrategies] = useState([]);

    const loadStrategies = async () => {
        if (!selectedSymbol) return;
        try {
            const { getStrategies } = await import('../../api/strategies.api');
            const allStrategies = await getStrategies();
            // Filter strictly for current symbol
            // Normalize: Remove 'NSE:', 'BSE:', 'MCX:' prefixes
            const normalize = (s) => s ? s.toUpperCase().split(':').pop() : '';
            const currentSym = normalize(selectedSymbol.symbol);

            const relevant = allStrategies.filter(s => {
                const stratSym = normalize(s.symbol);
                // 1. Check Global
                if (stratSym === 'GLOBAL') return true;

                // 2. Check primary symbol
                if (stratSym === currentSym) return true;

                // 3. Check if strategy has multiple symbols array
                if (Array.isArray(s.symbols) && s.symbols.map(normalize).includes(currentSym)) return true;

                return false;
            });

            setSymbolStrategies(relevant);

            // Derive "Active Bot" status from strategies: If ANY strategy is Active, Bot is ON
            setActiveBot(relevant.some(s => s.status === 'Active'));
        } catch (e) {
            console.error("Failed to load strategies", e);
        }
    };

    // 2. Fetch Signals & Strategies
    useEffect(() => {
        if (!selectedSymbol) return;

        // 2a. Fetch Signals
        setSymbolSignals([]);
        refreshSignals();

        // 2b. Fetch Strategies
        loadStrategies();
    }, [selectedSymbol]);

    // ... (Socket effect below needs update)

    // 3. Auto-Apply Strategy Indicators
    // 3. Auto-Apply Strategy Indicators
    useEffect(() => {
        // Atomic Update Logic to prevent render loops
        setActiveIndicators(prev => {
            // 1. Filter out existing strategy indicators
            const baseIndicators = prev.filter(ind => !ind.isStrategy);

            if (strategyFilter === 'ALL' || !selectedSymbol) {
                // If nothing selected, just return base (if changed)
                if (baseIndicators.length === prev.length) return prev;
                return baseIndicators;
            }

            // 2. Find selected strategy
            const strategy = symbolStrategies.find(s => (s._id === strategyFilter || s.id === strategyFilter));
            if (!strategy) return baseIndicators; // If strategy not found, return clean list

            // 3. Map Rules to Indicators
            const newIndicators = mapStrategyToIndicators(strategy);

            // 4. Force Heikin Ashi for Hybrid Strategy
            // Use 'heiken' (LWC standard) instead of 'heikin_ashi'
            if (strategy.name === 'Hybrid Strategy' || strategy.candleType === 'Heikin Ashi') {
                // Defer update to avoid immediate re-render conflict
                setTimeout(() => {
                    setChartType(curr => {
                        if (curr !== 'heiken') {
                            localStorage.setItem('mspk_chart_type', 'heiken');
                            return 'heiken';
                        }
                        return curr;
                    });
                }, 0);
            }

            // 5. Return Merged State
            // Check if actual change occurred to prevent re-render?
            // Arrays are hard to shallow compare easily here, but new objects are created anyway.
            return [...baseIndicators, ...newIndicators];
        });

    }, [strategyFilter, symbolStrategies, selectedSymbol]);

    const handleToggleStrategy = async (strategyId, currentStatus) => {
        try {
            const { updateStrategy } = await import('../../api/strategies.api');
            const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';

            // Optimistic Update
            setSymbolStrategies(prev => prev.map(s => s._id === strategyId || s.id === strategyId ? { ...s, status: newStatus } : s));

            await updateStrategy(strategyId, { status: newStatus });

            // Re-calc master bot status
            setActiveBot(symbolStrategies.map(s => s._id === strategyId ? { ...s, status: newStatus } : s).some(s => s.status === 'Active'));

        } catch (e) {
            console.error(e);
            loadStrategies(); // Revert on error
        }
    };

    // 3. Socket Connection (Fixed Stale Closures & Memory Leaks)
    const [lastTick, setLastTick] = useState(null);
    const selectedSymbolRef = React.useRef(selectedSymbol);
    const symbolsRef = React.useRef(symbols);

    // Keep refs updated
    useEffect(() => {
        selectedSymbolRef.current = selectedSymbol;
        symbolsRef.current = symbols;
    }, [selectedSymbol, symbols]);

    useEffect(() => {
        // Subscribe to current watchlist symbols AND selected symbol (if not in watchlist)
        const subList = [...symbols];
        if (selectedSymbol && !subList.find(s => s.symbol === selectedSymbol.symbol)) {
            subList.push(selectedSymbol);
        }

        if (subList.length === 0) return;

        let activeSocket = null;
        let isMounted = true;

        const initSocket = async () => {
            const { socket } = await import('../../api/socket');
            if (!socket || !isMounted) return;
            activeSocket = socket;

            const onTick = (tick) => {
                const currentSelected = selectedSymbolRef.current;

                setMarketData(prev => {
                    // Optimization: Fail fast if no data
                    if (!prev) return prev;

                    // Find category - Optimization: Map lookup would be faster but object scan is acceptable for <100 items
                    const cat = Object.keys(prev).find(key => prev[key].some(s => s.symbol === tick.symbol));
                    if (!cat) return prev;

                    if (prev[cat]) {
                        const newState = { ...prev };
                        const idx = newState[cat].findIndex(s => s.symbol === tick.symbol);

                        if (idx !== -1) {
                            const currentItem = newState[cat][idx];
                            const incomingPrice = parseFloat(tick.price || 0);
                            const finalPrice = incomingPrice > 0 ? incomingPrice : currentItem.price;

                            // Dynamic Change Calculation
                            let finalChange = currentItem.change;
                            let finalChangePercent = currentItem.changePercent;
                            const prevClose = currentItem.prevClose || currentItem.ohlc?.close || currentItem.closePrice;

                            if (prevClose && finalPrice > 0) {
                                finalChange = finalPrice - prevClose;
                                finalChangePercent = (finalChange / prevClose) * 100;
                            } else if (tick.change) {
                                finalChange = parseFloat(tick.change);
                                finalChangePercent = parseFloat(tick.changePercent || 0);
                            }

                            // Mutation free update
                            newState[cat] = [...newState[cat]]; // Shallow copy array
                            newState[cat][idx] = {
                                ...currentItem,
                                price: finalPrice,
                                change: finalChange,
                                changePercent: finalChangePercent,
                                bid: parseFloat(tick.bid || currentItem.bid || 0),
                                ask: parseFloat(tick.ask || currentItem.ask || 0),
                                volume: parseFloat(tick.total_volume || tick.volume || tick.v || tick.vol || tick.lastVolume || currentItem.volume || 0)
                            };
                        }
                        return newState;
                    }
                    return prev;
                });

                if (tick.symbol) {
                    // Normalize symbols for comparison
                    const tickSym = tick.symbol.toUpperCase();
                    const currSym = currentSelected?.symbol?.toUpperCase();

                    if (tickSym === currSym) {
                        setLastTick(tick);
                    }
                }
            };

            subList.forEach(s => socket.emit('subscribe', s.symbol));
            socket.on('tick', onTick);

            // Listen for Global Bot Status
            socket.on('bot_status', (data) => {
                if (isMounted) setActiveBot(data.status === 'ON');
            });

            // Listen for New Signals
            socket.on('new_signal', (signal) => {
                const currentSelected = selectedSymbolRef.current;
                const normalizedSignalTimeframe = normalizeSignalTimeframe(signal.timeframe);

                // If signal belongs to current symbol and one of the visible panes, keep it in local cache
                if (
                    signal.symbol === currentSelected?.symbol &&
                    MULTI_TIMEFRAME_WINDOWS.some((pane) => matchesSignalTimeframe(normalizedSignalTimeframe, pane.value))
                ) {
                    setSymbolSignals(prev => upsertSignal(prev, signal));

                    // Play Sound
                    const audio = new Audio('/sounds/signal_alert.mp3');
                    audio.play().catch(e => { });
                }
            });
        };
        initSocket();

        return () => {
            isMounted = false;
            if (activeSocket) {
                // Thorough cleanup
                subList.forEach(s => activeSocket.emit('unsubscribe', s.symbol));
                activeSocket.off('tick');
                activeSocket.off('bot_status');
                activeSocket.off('new_signal');
            }
        };
    }, [symbols, selectedSymbol]); // Dependencies remain, but internal logic uses Refs for safety

    // -- Handlers --

    const handleQuickSignal = (type, targetTimeframe = timeframe) => {
        setQuickSignal({
            isOpen: true,
            type,
            price: lastTick?.price ? parseFloat(lastTick.price) : selectedSymbol?.price,
            timeframe: targetTimeframe
        });
    };

    const handleSignalSuccess = () => {
        setQuickSignal({ ...quickSignal, isOpen: false });
        refreshSignals(); // Instant refresh
    };



    const handleRemoveSymbol = async (symbol) => {
        try {
            await updateSymbol(symbol._id, { isWatchlist: false });
            // Refresh watchlist
            loadWatchlist();
        } catch (error) {
            console.error("Failed to remove symbol from watchlist", error);
        }
    };

    const handleRemoveCategory = async (categoryName) => {
        // Find all symbols in this category
        if (!marketData[categoryName]) return;
        const symbolsToRemove = marketData[categoryName];

        try {
            // Execute all updates in parallel
            await Promise.all(symbolsToRemove.map(s => updateSymbol(s._id, { isWatchlist: false })));
            // Refresh watchlist
            loadWatchlist();
        } catch (error) {
            console.error("Failed to remove category", error);
        }
    };


    const handleSnapshotCaptured = (imageSrc) => {
        setSnapshotModal({ isOpen: true, image: imageSrc });
    };

    const handleResetChart = () => {
        // 1. Reset Settings
        setChartSettings({
            symbol: {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderUpColor: '#10b981',
                borderDownColor: '#ef4444',
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
                realPrices: false,
            },
            canvas: {
                backgroundType: 'solid',
                backgroundColor: 'transparent',
                gridVertLines: true,
                gridHorzLines: true,
            },
            scales: {
                showLastPrice: true,
                showSymbolName: true,
            }
        });
        localStorage.removeItem('mspk_chart_settings');

        // 2. Clear Indicators
        setActiveIndicators([]);
        localStorage.removeItem('mspk_active_indicators');

        // 3. Clear Drawings
        setClearToggle(p => p + 1);
        // Also clear ALL symbol drawings? Or just current?
        // User said "delete button hai usse delete na kiya jaye".
        // Usually reset chart implies resetting current view. But if persistence is per symbol...
        // Let's clear current symbol drawings too in TradingChart, which listens to clearToggle.
        // But we can't easily clear localStorage for drawings here without knowing the key.
        // Actually, we can dispatch an event or let TradingChart handle the cleanup via clearToggle effect.

        // 4. Reset Type & Timeframe
        setChartType('candle');
        setTimeframe('5');
        setShowVolume(true);
        localStorage.removeItem('mspk_chart_type');
        localStorage.removeItem('mspk_timeframe');
        localStorage.removeItem('mspk_show_volume');
    };

    // -- Memoized Signals for Multi-Timeframe Charts --
    const chartSignalsByTimeframe = React.useMemo(() => {
        return MULTI_TIMEFRAME_WINDOWS.reduce((accumulator, pane) => {
            const paneSignals = symbolSignals.filter((signal) => {
                if (!matchesSignalTimeframe(signal.timeframe, pane.value)) return false;
                if (strategyFilter === 'ALL') return true;
                return resolveSignalStrategyId(signal) === strategyFilter;
            });

            accumulator[pane.value] = {
                activeSignals: paneSignals.filter((signal) =>
                    ACTIVE_SIGNAL_STATUSES.has(String(signal.status || '').toUpperCase())
                ),
                signalMarkers: paneSignals
                    .slice()
                    .sort((left, right) => {
                        const leftTime = new Date(getSignalEventTime(left) || 0).getTime();
                        const rightTime = new Date(getSignalEventTime(right) || 0).getTime();
                        return leftTime - rightTime;
                    })
                    .map((signal) => buildSignalMarker(signal, pane.value))
                    .filter(Boolean)
            };

            return accumulator;
        }, {});
    }, [symbolSignals, strategyFilter]);

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground font-mono animate-pulse">Initializing Trading Engine...</div>;

    const showCharts = !hideCharts;
    const activePaneTimeframe = MULTI_TIMEFRAME_WINDOW_SET.has(timeframe) ? timeframe : '5';
    const allSymbols = Object.values(marketData).flat();
    const liveSymbol = selectedSymbol ? allSymbols.find(s => s.symbol === selectedSymbol.symbol) : null;
    const mergedSymbol = liveSymbol ? { ...selectedSymbol, ...liveSymbol } : selectedSymbol;
    const mergedLive = (lastTick?.symbol && mergedSymbol?.symbol && lastTick.symbol === mergedSymbol.symbol)
        ? { ...mergedSymbol, ...lastTick }
        : mergedSymbol;
    const priceValue = typeof mergedLive?.price === 'number' ? mergedLive.price : Number(mergedLive?.lastPrice || 0) || 0;
    const changeValue = typeof mergedLive?.change === 'number' ? mergedLive.change : Number(mergedLive?.change || 0) || 0;
    const changePercentValue = typeof mergedLive?.changePercent === 'number' ? mergedLive.changePercent : Number(mergedLive?.changePercent || 0) || 0;
    const isUp = changeValue >= 0;
    const formatNumber = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : '—');
    const formatCompact = (value) => (Number.isFinite(value) ? value.toLocaleString() : '—');

    if (!showCharts) {
        return (
            <div className="flex h-full flex-col bg-background text-foreground font-sans overflow-hidden">
                <div className="relative border-b border-border bg-card/60 backdrop-blur-md">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]" />
                    <div className="relative mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-5">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-muted-foreground">Market Pulse</p>
                                <h1 className="mt-1 text-2xl font-bold text-foreground">Live Market Dashboard</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Clean, focused view of watchlist movement and live signal snapshots.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="h-9 px-4 text-[11px] font-bold uppercase tracking-wide btn-cancel"
                                    onClick={() => setSearchModal({ isOpen: true, mode: 'VIEW' })}
                                >
                                    Search Symbols
                                </Button>
                                <Button
                                    variant="primary"
                                    className="h-9 px-4 text-[11px] font-bold uppercase tracking-wide btn-primary-soft"
                                    onClick={() => setSearchModal({ isOpen: true, mode: 'ADD' })}
                                >
                                    Add to Watchlist
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
                            <div className="rounded-2xl border border-border bg-muted/10 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black tracking-tight text-foreground">
                                                {mergedLive?.symbol || 'Select a Symbol'}
                                            </span>
                                            {(mergedLive?.segment || mergedLive?.segmentGroup) && (
                                                <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                                                    {getSegmentGroup(mergedLive)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {mergedLive?.description || mergedLive?.name || 'Live market movement & watchlist signals'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-foreground">{formatNumber(priceValue)}</div>
                                            <div className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isUp ? '+' : ''}{formatNumber(changeValue)} ({isUp ? '+' : ''}{formatNumber(changePercentValue)}%)
                                            </div>
                                        </div>
                                        <span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] ${isUp ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
                                            {isUp ? 'Bull' : 'Bear'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-border bg-card/60 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Volume</p>
                                    <p className="mt-2 text-lg font-bold text-foreground">{formatCompact(Number(mergedLive?.volume || mergedLive?.v || 0))}</p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">Total traded</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card/60 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Prev Close</p>
                                    <p className="mt-2 text-lg font-bold text-foreground">{formatNumber(Number(mergedLive?.prevClose || mergedLive?.ohlc?.close || 0))}</p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">Reference price</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="mx-auto grid h-full max-w-[1600px] gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card/50 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Watchlist</p>
                                    <p className="text-sm font-semibold text-foreground">Live Movement</p>
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    {symbols.length} Symbols
                                </div>
                            </div>
                            <div className="min-h-0 flex-1">
                                <TradingWatchlist
                                    marketData={marketData}
                                    selectedSymbol={selectedSymbol}
                                    onSelect={(s) => setSelectedSymbol(s)}
                                    onAddSymbol={() => setSearchModal({ isOpen: true, mode: 'ADD' })}
                                    onRemoveSymbol={handleRemoveSymbol}
                                    onReorder={handleWatchlistReorder}
                                    categoryOrder={categoryOrder}
                                    onReorderCategories={handleCategoryReorder}
                                    onRemoveCategory={handleRemoveCategory}
                                    settings={watchlistSettings}
                                    onSettingsChange={setWatchlistSettings}
                                />
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card/50 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Signals</p>
                                    <p className="text-sm font-semibold text-foreground">Strategy Highlights</p>
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    {mergedLive?.symbol || 'No symbol'}
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 overflow-hidden">
                                <SignalCardsPanel symbol={selectedSymbol} />
                            </div>
                        </div>
                    </div>
                </div>

                <SymbolSearchModal
                    isOpen={searchModal.isOpen}
                    onClose={() => setSearchModal({ ...searchModal, isOpen: false })}
                    mode={searchModal.mode}
                    onSelect={(sym) => {
                        if (searchModal.mode === 'VIEW') {
                            setSelectedSymbol(sym);
                        } else {
                            loadWatchlist();
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background text-muted-foreground overflow-hidden font-sans">
            {/* Top Header */}
            <div className="h-12 border-b border-border flex-none bg-card/50 backdrop-blur-sm z-[100] relative">
                <TradingHeader
                    symbol={selectedSymbol && lastTick?.symbol === selectedSymbol.symbol ? { ...selectedSymbol, ...lastTick } : selectedSymbol}
                    onSymbolChange={setSelectedSymbol}
                    allSymbols={symbols}
                    onToggleWatchlist={() => setRightSidebarOpen(!rightSidebarOpen)}
                    activeBot={activeBot}
                    symbolStrategies={symbolStrategies}
                    onToggleStrategy={handleToggleStrategy}
                    strategyFilter={strategyFilter}
                    onStrategyFilterChange={setStrategyFilter}
                    onTitleClick={() => setSearchModal({ isOpen: true, mode: 'VIEW' })} // Open Search to VIEW
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    timeframeOptions={MULTI_TIMEFRAME_WINDOWS.map((item) => item.value)}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                    onIndicatorsClick={() => setIndicatorsModalOpen(true)}
                    onSettingsClick={() => setSettingsModalOpen(true)}
                    onResetChart={handleResetChart}
                    onSnapshotClick={() => setSnapshotTrigger({ id: Date.now(), timeframe: activePaneTimeframe })}
                    hideChartControls={hideCharts}
                    hideWatchlistToggle={hideCharts}
                />
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Left Toolbar */}
                {showCharts && (
                    <div className="w-12 border-r border-border flex-none hidden md:flex flex-col items-center py-2 bg-card/30">
                        <TradingToolbar
                            activeTool={activeTool}
                            onToolChange={setActiveTool}
                            onClearDrawings={() => setClearToggle(p => p + 1)}
                        />
                    </div>
                )}

                {/* Center Chart */}
                {showCharts && (
                    <div className="flex-1 relative min-w-0 bg-background/50">
                        {selectedSymbol && (
                            <div className="grid h-full auto-rows-fr grid-cols-1 gap-3 overflow-auto p-3 lg:grid-cols-2 2xl:grid-cols-3">
                                {MULTI_TIMEFRAME_WINDOWS.map((pane) => {
                                    const paneState = chartSignalsByTimeframe[pane.value] || {
                                        activeSignals: [],
                                        signalMarkers: []
                                    };
                                    const isActivePane = activePaneTimeframe === pane.value;

                                    return (
                                        <div
                                            key={pane.value}
                                            className={`flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border bg-card/70 shadow-sm transition ${isActivePane ? 'border-primary/60 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]' : 'border-border/70'}`}
                                            onMouseDownCapture={() => setTimeframe(pane.value)}
                                        >
                                            <div className="flex items-center justify-between border-b border-border/70 bg-card/90 px-4 py-2.5">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{pane.label}</p>
                                                    <p className="text-xs text-muted-foreground">{pane.description}</p>
                                                </div>
                                                <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] ${isActivePane ? 'bg-primary/10 text-primary' : 'bg-muted/20 text-muted-foreground'}`}>
                                                    {isActivePane ? 'Active Pane' : 'Visible'}
                                                </span>
                                            </div>

                                            <div className="min-h-0 flex-1">
                                                <TradingChart
                                                    symbol={mergedLive}
                                                    latestTick={lastTick?.symbol === selectedSymbol.symbol ? lastTick : null}
                                                    activeSignals={paneState.activeSignals}
                                                    signalMarkers={paneState.signalMarkers}
                                                    onQuickSignal={(type) => handleQuickSignal(type, pane.value)}
                                                    timeframe={pane.value}
                                                    chartType={chartType}
                                                    onChartTypeChange={setChartType}
                                                    activeIndicators={activeIndicators}
                                                    showVolume={showVolume}
                                                    onRemoveIndicator={(uuid) => {
                                                        if (uuid === 'VOLUME_ID') setShowVolume(false);
                                                        else setActiveIndicators(prev => prev.filter(i => i.uuid !== uuid));
                                                    }}
                                                    onEditIndicator={(ind) => setEditingIndicator(ind)}
                                                    activeTool={activeTool}
                                                    clearDrawingsToggle={clearToggle}
                                                    chartSettings={chartSettings}
                                                    snapshotTrigger={snapshotTrigger.timeframe === pane.value ? snapshotTrigger.id : 0}
                                                    onSnapshotCaptured={isActivePane ? handleSnapshotCaptured : undefined}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Resizer Handle (Desktop Only) */}
                {showCharts && (
                    <div
                        className={`hidden md:block w-1 hover:w-1.5 cursor-col-resize z-50 transition-all hover:bg-primary/50 ${isResizing ? 'bg-primary w-1.5' : 'bg-transparent'}`}
                        onMouseDown={startResizing}
                    />
                )}

                {/* Right Watchlist */}
                <div
                    className={`
                        ${showCharts
                            ? `fixed inset-y-0 right-0 top-12 bottom-0 z-40 bg-card border-l border-border transition-transform duration-300 ease-in-out font-sans
                               md:relative md:top-0 md:translate-x-0 md:flex-col md:flex-none md:transition-none
                               ${rightSidebarOpen ? 'translate-x-0 md:flex' : 'translate-x-full md:hidden'}`
                            : 'relative flex-1 min-w-0 bg-card font-sans'}
`}
                    style={showCharts ? { width: window.innerWidth >= 768 ? sidebarWidth : '288px' } : { width: '100%' }} // 288px = w-72 (mobile default)
                >
                    <div className="flex flex-col h-full relative" ref={sidebarRef}>
                        {/* Top Half: Watchlist */}
                        <div
                            className="min-h-[100px] relative"
                            style={{ height: `${watchlistHeight}%` }}
                        >
                            <TradingWatchlist
                                marketData={marketData}
                                selectedSymbol={selectedSymbol}
                                onSelect={(s) => {
                                    setSelectedSymbol(s);
                                    if (showCharts && window.innerWidth < 768) setRightSidebarOpen(false);
                                }}
                                onClose={showCharts ? () => setRightSidebarOpen(false) : undefined}
                                onAddSymbol={() => setSearchModal({ isOpen: true, mode: 'ADD' })} // Open Search to ADD
                                onRemoveSymbol={handleRemoveSymbol}
                                onReorder={handleWatchlistReorder}
                                categoryOrder={categoryOrder}
                                onReorderCategories={handleCategoryReorder}
                                onRemoveCategory={handleRemoveCategory}
                                settings={watchlistSettings}
                                onSettingsChange={setWatchlistSettings}
                            />
                        </div>

                        {/* Resizer Handle (Vertical) */}
                        <div
                            className={`w-full h-1 hover:h-1.5 cursor-row-resize z-50 transition-all hover:bg-primary/50 flex-none ${isResizingVertical ? 'bg-primary h-1.5' : 'bg-border/50'}`}
                            onMouseDown={startResizingVertical}
                        />

                        {/* Bottom Half: Pro Signals */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <SignalCardsPanel symbol={selectedSymbol} />
                        </div>
                    </div>
                </div>


                {/* Mobile Overlay */}
                {showCharts && rightSidebarOpen && (
                    <div
                        className="fixed inset-0 top-12 bg-black/50 z-30 md:hidden backdrop-blur-[1px]"
                        onClick={() => setRightSidebarOpen(false)}
                    />
                )}
            </div>

            {/* Quick Signal Modal */}
            <QuickSignalModal
                isOpen={quickSignal.isOpen}
                onClose={() => setQuickSignal({ ...quickSignal, isOpen: false })}
                symbol={selectedSymbol}
                type={quickSignal.type}
                currentPrice={quickSignal.price}
                timeframe={quickSignal.timeframe || activePaneTimeframe}
                onSuccess={handleSignalSuccess}
            />

            {/* Symbol Search Modal */}
            <SymbolSearchModal
                isOpen={searchModal.isOpen}
                onClose={() => setSearchModal({ ...searchModal, isOpen: false })}
                mode={searchModal.mode}
                onSelect={(sym) => {
                    if (searchModal.mode === 'VIEW') {
                        setSelectedSymbol(sym);
                    } else {
                        // If added to watchlist, refresh watchlist
                        loadWatchlist();
                    }
                }}
            />

            {showCharts && (
                <>
                    <IndicatorsModal
                        isOpen={indicatorsModalOpen}
                        onClose={() => setIndicatorsModalOpen(false)}
                        onAddIndicator={(ind) => {
                            if (ind.id === 'VOL') {
                                setShowVolume(true);
                            } else {
                                setActiveIndicators(prev => [...prev, ind]);
                            }
                        }}
                    />

                    <TradingChartSettings
                        isOpen={settingsModalOpen}
                        onClose={() => setSettingsModalOpen(false)}
                        chartType={chartType}
                        onChartTypeChange={setChartType}
                        settings={chartSettings}
                        onSettingsChange={setChartSettings}
                    />

                    <IndicatorSettingsModal
                        isOpen={!!editingIndicator}
                        onClose={() => setEditingIndicator(null)}
                        indicator={editingIndicator}
                        onSave={(uuid, newSettings) => {
                            setActiveIndicators(prev => prev.map(i => i.uuid === uuid ? { ...i, ...newSettings } : i));
                        }}
                    />

                    <SnapshotModal
                        isOpen={snapshotModal.isOpen}
                        onClose={() => setSnapshotModal({ ...snapshotModal, isOpen: false })}
                        imageSrc={snapshotModal.image}
                        fileName={`MSPK_Chart_${selectedSymbol?.symbol || 'Chart'}_${parseFloat(timeframe) ? timeframe + 'm' : timeframe}_${new Date().toISOString().slice(0, 10)}.png`}
                    />
                </>
            )}

        </div>
    );
};

export default TradingLayout;
