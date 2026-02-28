import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TradingHeader from './TradingHeader';
import TradingToolbar from './TradingToolbar';
import TradingChart from './TradingChart';
import TradingChartGL from './TradingChartGL';
import PerformanceMonitor from '../dev/PerformanceMonitor';
import TradingWatchlist from './TradingWatchlist';
import QuickSignalModal from './QuickSignalModal';
import SymbolSearchModal from './SymbolSearchModal';
import IndicatorsModal from './IndicatorsModal';
import IndicatorSettingsModal from './IndicatorSettingsModal';
import TradingChartSettings from './TradingChartSettings';
import SnapshotModal from './SnapshotModal';
import SignalCardsPanel from './SignalCardsPanel';
import { socket } from '../../api/socket';
import { getSymbols, updateSymbol } from '../../api/market.api';
import { mapStrategyToIndicators } from '../../utils/strategyMapping';
import chartCache from '../../utils/ChartDataCache';

const TradingLayout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    // -- Global State --
    const [symbols, setSymbols] = useState([]); // Currently active list (Watchlist)
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // -- Data Feed State --
    const [marketData, setMarketData] = useState({});

    // -- Layout State --
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [timeframe, setTimeframe] = useState(() => localStorage.getItem('mspk_timeframe') || '5');
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
    const [snapshotTrigger, setSnapshotTrigger] = useState(0);

    // -- Signals State --
    const [activeSignals, setActiveSignals] = useState([]);
    const [signalMarkers, setSignalMarkers] = useState([]);

    // -- Quick Signal State --
    const [quickSignal, setQuickSignal] = useState({ isOpen: false, type: 'BUY' });

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
                const cat = s.segment || 'OTHER';
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
            const res = await fetchSignals({ symbol: selectedSymbol.symbol });
            const signalsData = res.data?.results || res.results || (Array.isArray(res.data) ? res.data : []);

            if (signalsData.length > 0) {
                const allSignals = signalsData;

                // 1. Active Lines
                const active = allSignals.filter(s => ['Active', 'ENTRY_PENDING'].includes(s.status));
                setActiveSignals(active);

                // 2. Markers (History + Active)
                const markers = allSignals.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(s => {
                    const time = new Date(s.createdAt).getTime() / 1000;

                    // NEW: Improved snap logic for all resolutions (including D, W, M)
                    let snappedTime = time;
                    if (timeframe === 'D' || timeframe === '1D') {
                        const date = new Date(time * 1000);
                        date.setUTCHours(0, 0, 0, 0);
                        snappedTime = date.getTime() / 1000;
                    } else if (timeframe === 'W' || timeframe === '1W') {
                        const date = new Date(time * 1000);
                        const day = date.getUTCDay();
                        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // ISO week start (Monday)
                        date.setUTCDate(diff);
                        date.setUTCHours(0, 0, 0, 0);
                        snappedTime = date.getTime() / 1000;
                    } else if (timeframe === 'M' || timeframe === '1M') {
                        const date = new Date(time * 1000);
                        date.setUTCDate(1);
                        date.setUTCHours(0, 0, 0, 0);
                        snappedTime = date.getTime() / 1000;
                    } else {
                        const tfMinutes = parseInt(timeframe) || 5;
                        const tfSeconds = tfMinutes * 60;
                        snappedTime = Math.floor(time - (time % tfSeconds));
                    }

                    return {
                        time: snappedTime,
                        position: s.type === 'BUY' ? 'belowBar' : 'aboveBar',
                        color: s.type === 'BUY' ? '#10b981' : '#ef4444',
                        shape: s.type === 'BUY' ? 'arrowUp' : 'arrowDown',
                        text: `${s.type} `,
                        size: 2,
                        strategyId: s.strategyId ? String(s.strategyId) : 'MANUAL'
                    };
                });
                console.log("DEBUG: Refresh Signals - Markers generated:", markers);
                setSignalMarkers(markers);
            }
        } catch (error) {
            console.error("Failed to fetch signals", error);
        }
    }, [selectedSymbol, timeframe]);

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
        setActiveSignals([]);
        refreshSignals();

        // 2b. Fetch Strategies
        loadStrategies();
    }, [selectedSymbol, timeframe]);

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

                // If signal belongs to current symbol, add it
                if (signal.symbol === currentSelected?.symbol) {
                    // 1. Add to Active Signals (Lines)
                    setActiveSignals(prev => [...prev, signal]);

                    // 2. Markers logic (Recalculated in real-time)
                    setSignalMarkers(prev => {
                        const time = new Date(signal.createdAt).getTime() / 1000;
                        let snappedTime = time;
                        // Simplified snap just for alerting, full recalc happens on refresh
                        const tfMinutes = parseInt(timeframe) || 5;
                        if (!isNaN(tfMinutes)) snappedTime = time - (time % (tfMinutes * 60));

                        const newMarker = {
                            time: snappedTime,
                            position: signal.type === 'BUY' ? 'belowBar' : 'aboveBar',
                            color: signal.type === 'BUY' ? '#10b981' : '#ef4444',
                            shape: signal.type === 'BUY' ? 'arrowUp' : 'arrowDown',
                            text: `${signal.type} `,
                            size: 2,
                            strategyId: signal.strategyId ? String(signal.strategyId) : 'MANUAL'
                        };
                        return [...prev, newMarker];
                    });

                    // 3. Play Sound
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

    const handleQuickSignal = (type) => {
        setQuickSignal({
            isOpen: true,
            type,
            price: lastTick?.price ? parseFloat(lastTick.price) : selectedSymbol?.price
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

    // -- Memoized Signals for Chart --
    const filteredActiveSignals = React.useMemo(() =>
        activeSignals.filter(s => strategyFilter === 'ALL' || s.strategyId === strategyFilter),
        [activeSignals, strategyFilter]
    );

    const filteredSignalMarkers = React.useMemo(() =>
        signalMarkers.filter(m => strategyFilter === 'ALL' || m.strategyId === strategyFilter),
        [signalMarkers, strategyFilter]
    );

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground font-mono animate-pulse">Initializing Trading Engine...</div>;

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
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                    onIndicatorsClick={() => setIndicatorsModalOpen(true)}
                    onSettingsClick={() => setSettingsModalOpen(true)}
                    onResetChart={handleResetChart}
                    onSnapshotClick={() => setSnapshotTrigger(Date.now())}
                />
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Left Toolbar */}
                <div className="w-12 border-r border-border flex-none hidden md:flex flex-col items-center py-2 bg-card/30">
                    <TradingToolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        onClearDrawings={() => setClearToggle(p => p + 1)}
                    />
                </div>

                {/* Center Chart */}
                <div className="flex-1 relative min-w-0 bg-background/50">
                    {selectedSymbol && (
                        <TradingChart
                            symbol={(() => {
                                // Find the latest live version of this symbol from marketData
                                // Flatten marketData values to find the match
                                const allSymbols = Object.values(marketData).flat();
                                const liveSymbol = allSymbols.find(s => s.symbol === selectedSymbol.symbol);
                                // Merge: Static < Live
                                return liveSymbol ? { ...selectedSymbol, ...liveSymbol } : selectedSymbol;
                            })()}
                            latestTick={lastTick?.symbol === selectedSymbol.symbol ? lastTick : null}
                            activeSignals={filteredActiveSignals}
                            signalMarkers={filteredSignalMarkers}
                            onQuickSignal={handleQuickSignal}
                            timeframe={timeframe}
                            chartType={chartType}
                            onChartTypeChange={setChartType}
                            // Indicators
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
                            snapshotTrigger={snapshotTrigger}
                            onSnapshotCaptured={handleSnapshotCaptured}
                        />
                    )}
                </div>

                {/* Resizer Handle (Desktop Only) */}
                <div
                    className={`hidden md:block w-1 hover:w-1.5 cursor-col-resize z-50 transition-all hover:bg-primary/50 ${isResizing ? 'bg-primary w-1.5' : 'bg-transparent'}`}
                    onMouseDown={startResizing}
                />

                {/* Right Watchlist */}
                <div
                    className={`
                        fixed inset-y-0 right-0 top-12 bottom-0 z-40 bg-card border-l border-border transition-transform duration-300 ease-in-out font-sans
                        md:relative md:top-0 md:translate-x-0 md:flex-col md:flex-none md:transition-none
                        ${rightSidebarOpen ? 'translate-x-0 md:flex' : 'translate-x-full md:hidden'}
`}
                    style={{ width: window.innerWidth >= 768 ? sidebarWidth : '288px' }} // 288px = w-72 (mobile default)
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
                                    if (window.innerWidth < 768) setRightSidebarOpen(false);
                                }}
                                onClose={() => setRightSidebarOpen(false)}
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
                {rightSidebarOpen && (
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
                timeframe={timeframe}
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

            {/* Phase 5 Performance Monitor */}
            <PerformanceMonitor />
        </div>
    );
};

export default TradingLayout;
