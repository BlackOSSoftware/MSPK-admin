import React, { useState, useRef, useEffect } from 'react';
import {
    Search, ChevronDown, BarChart2, Settings, Clock,
    Undo2, Redo2, Camera, Maximize, Minimize, LayoutGrid, Plus, History, Bell, ChevronLeft, Flag, Activity, Trash2
} from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';

const TIMEFRAMES = ['D']; // Screenshot shows 'D'. We can make this dynamic later.

const IconButton = ({ children, className = "", active = false, label, onClick }) => (
    <button
        title={label}
        onClick={onClick}
        className={`p-1.5 rounded-md transition hover:bg-accent hover:text-accent-foreground text-muted-foreground ${active ? 'bg-accent/50 text-foreground' : ''} ${className}`}
    >
        {children}
    </button>
);

const Separator = () => <div className="w-px h-5 bg-border mx-1" />;

const TradingHeader = ({
    symbol,
    onSymbolChange,
    onToggleWatchlist,
    activeBot,
    symbolStrategies = [],
    onToggleStrategy,
    strategyFilter = 'ALL',
    onStrategyFilterChange,
    onTitleClick,
    timeframe,
    onTimeframeChange,
    chartType,
    onChartTypeChange,
    onIndicatorsClick,
    onSettingsClick,
    onResetChart,
    onSnapshotClick,
    hideChartControls = false,
    hideWatchlistToggle = false
}) => {
    const [isTfOpen, setIsTfOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isBotMenuOpen, setIsBotMenuOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false); // New State

    const tfRef = useRef(null);
    const typeRef = useRef(null);
    const botMenuRef = useRef(null);
    const filterRef = useRef(null); // New Ref

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tfRef.current && !tfRef.current.contains(event.target)) {
                setIsTfOpen(false);
            }
            if (typeRef.current && !typeRef.current.contains(event.target)) {
                setIsTypeOpen(false);
            }
            if (botMenuRef.current && !botMenuRef.current.contains(event.target)) {
                setIsBotMenuOpen(false);
            }
            if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Full Screen Logic
    const [isFullScreen, setIsFullScreen] = useState(false);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => console.error(err));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullScreen(false));
            }
        };
    };

    // Listen for fullscreen change events (ESC key etc)
    useEffect(() => {
        const onFsChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const popularTimeframes = [
        { label: '1m', value: '1' },
        { label: '5m', value: '5' },
        { label: '15m', value: '15' },
        { label: '1h', value: '60' },
        { label: 'D', value: 'D' },
        { label: 'W', value: 'W' },
    ];

    const allTimeframes = [
        { label: '1m', value: '1' },
        { label: '3m', value: '3' },
        { label: '5m', value: '5' },
        { label: '10m', value: '10' },
        { label: '15m', value: '15' },
        { label: '30m', value: '30' },
        { label: '1h', value: '60' },
        { label: 'D', value: 'D' },
        { label: 'W', value: 'W' },
        { label: 'M', value: 'M' },
    ];

    return (
        <div className="flex items-center justify-between px-2 md:px-3 py-1.5 bg-card border-b border-border h-12 select-none font-sans gap-4 z-[100] relative">
            {/* LEFT SECTION */}
            <div className="flex items-center gap-1 flex-none">
                {/* Symbol Title (Click to Search) */}
                <div onClick={onTitleClick} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 py-1 px-2 rounded-md transition group mr-2" title="Switch Symbol">
                    <span className="font-bold text-sm text-foreground uppercase tracking-wide whitespace-nowrap">
                        {symbol?.symbol?.replace('NSE:', '') || 'CRUDEOIL'}
                    </span>
                    <span className="text-[10px] bg-accent px-1 rounded text-primary font-bold hidden sm:inline-block">Fut</span>
                </div>

                {/* Price Display */}
                {symbol && (
                    <div className="flex flex-col leading-none mr-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${symbol.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {symbol.price || symbol.lastPrice || '0.00'}
                            </span>
                        </div>
                    </div>
                )}

                {!hideChartControls && (
                    <>
                        <Separator />

                        {/* Timeframe Selector */}
                        <TimeframeSelector timeframe={timeframe} onTimeframeChange={onTimeframeChange} />

                        <Separator />

                        {/* Chart Type */}
                        <div className="relative" ref={typeRef}>
                            <div className="flex items-center" onClick={() => setIsTypeOpen(!isTypeOpen)}>
                                <IconButton active={isTypeOpen} className="flex items-center gap-0.5" label="Chart Style">
                                    <BarChart2 size={18} strokeWidth={1.5} />
                                    <ChevronDown size={12} />
                                </IconButton>
                            </div>

                            {isTypeOpen && (
                                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-md shadow-xl py-1 z-[9999] min-w-[140px] animate-in fade-in zoom-in duration-100">
                                    {[
                                        { label: 'Candles', value: 'candle', icon: BarChart2 },
                                        { label: 'Heiken Ashi', value: 'heiken', icon: LayoutGrid }, // Using Grid icon for now as proxy
                                        { label: 'Line', value: 'line', icon: Activity },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={(e) => {
                                                // e.stopPropagation(); // Try this if bubbling is an issue
                                                console.log('Chart Type Selected:', type.value);
                                                onChartTypeChange(type.value);
                                                setIsTypeOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-[11px] hover:bg-primary/10 hover:text-primary transition flex items-center gap-2 ${chartType === type.value ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {/* <type.icon size={14} /> */} {/* Icon optional */}
                                            <span>{type.label}</span>
                                            {chartType === type.value && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)] ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Indicators */}
                        <div onClick={onIndicatorsClick} className="flex items-center gap-1 px-2 py-1 hover:bg-accent rounded cursor-pointer transition whitespace-nowrap">
                            <History size={18} className="text-muted-foreground" strokeWidth={1.5} />
                            <span className="text-sm font-medium text-foreground hidden md:block">Indicators</span>
                        </div>
                    </>
                )}


            </div>

            {/* CENTER SECTION - CLEANED */}
            <div className="flex items-center gap-1 flex-none">
                {/* Empty for now, or could hold title */}
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-2 flex-none ml-auto">
                {!hideChartControls && (
                    <>
                        <IconButton label="Reset Chart" onClick={onResetChart}><Trash2 size={18} strokeWidth={1.5} className="text-red-500/70 hover:text-red-500" /></IconButton>
                        <Separator />
                        <IconButton label="Settings" onClick={onSettingsClick}><Settings size={18} strokeWidth={1.5} /></IconButton>
                        <IconButton
                            label={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                            className="hidden sm:block"
                            onClick={toggleFullScreen}
                        >
                            {isFullScreen ? <Minimize size={18} strokeWidth={1.5} /> : <Maximize size={18} strokeWidth={1.5} />}
                        </IconButton>
                        <IconButton label="Snapshot" onClick={onSnapshotClick}><Camera size={18} strokeWidth={1.5} /></IconButton>

                        {/* STRATEGY FILTER DROPDOWN */}
                        <div className="hidden md:block relative" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition border ${strategyFilter !== 'ALL' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-transparent text-muted-foreground border-transparent hover:bg-accent'
                                    }`}
                                title="Filter Chart Signals"
                            >
                                <LayoutGrid size={14} />
                                <span>{strategyFilter === 'ALL' ? 'All Strategies' : symbolStrategies.find(s => (s._id === strategyFilter || s.id === strategyFilter))?.name || 'Selected'}</span>
                                <ChevronDown size={12} className="opacity-70" />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-md shadow-xl w-48 z-[9999] p-1 animate-in fade-in zoom-in duration-100">
                                    <button
                                        onClick={() => { onStrategyFilterChange('ALL'); setIsFilterOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center justify-between ${strategyFilter === 'ALL' ? 'text-primary font-bold bg-primary/5' : 'text-foreground'}`}
                                    >
                                        <span>Show All Signals</span>
                                        {strategyFilter === 'ALL' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                    </button>

                                    {symbolStrategies.length > 0 && <Separator />}

                                    {symbolStrategies.map(strategy => (
                                        <button
                                            key={strategy._id || strategy.id}
                                            onClick={() => { onStrategyFilterChange(strategy._id || strategy.id); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-accent flex items-center justify-between ${strategyFilter === (strategy._id || strategy.id) ? 'text-primary font-bold bg-primary/5' : 'text-foreground'}`}
                                        >
                                            <span>{strategy.name}</span>
                                            {strategyFilter === (strategy._id || strategy.id) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </button>
                                    ))}

                                    {symbolStrategies.length === 0 && (
                                        <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">
                                            No strategies available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Bot Manager Dropdown */}
                <div className="hidden md:block relative" ref={botMenuRef}>
                    <button
                        onClick={() => setIsBotMenuOpen(!isBotMenuOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition shadow-sm border ${activeBot
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'
                            : 'bg-secondary text-muted-foreground border-border'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${activeBot ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {activeBot ? 'BOTS: ACTIVE' : 'BOTS: PAUSED'}
                        <ChevronDown size={12} className="ml-1 opacity-70" />
                    </button>

                    {isBotMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-md shadow-xl w-64 z-[9999] p-2 animate-in fade-in zoom-in duration-100">
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 px-2">
                                Strategies for {symbol?.symbol}
                            </div>

                            {symbolStrategies && symbolStrategies.length > 0 ? (
                                <div className="space-y-1">
                                    {symbolStrategies.map(strategy => (
                                        <div key={strategy._id || strategy.id} className="flex items-center justify-between p-2 rounded hover:bg-accent transition">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-foreground">{strategy.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{strategy.timeframe} • {strategy.action}</span>
                                            </div>

                                            {/* Toggle Switch */}
                                            <button
                                                onClick={() => onToggleStrategy(strategy._id || strategy.id, strategy.status)}
                                                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${strategy.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-600'}`}
                                            >
                                                <span className={`${strategy.status === 'Active' ? 'translate-x-4' : 'translate-x-1'} inline-block h-2 w-2 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded">
                                    No bots configured for this symbol.
                                </div>
                            )}

                            <Separator />
                            <div className="mt-2 text-[10px] text-center text-muted-foreground">
                                Manage all in <a href="/strategies/all" className="underline hover:text-foreground">Strategy Engine</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Watchlist Toggle */}
                {!hideWatchlistToggle && (
                    <button
                        onClick={onToggleWatchlist}
                        className="p-2 rounded hover:bg-accent text-muted-foreground"
                        title="Toggle Watchlist"
                    >
                        <LayoutGrid size={20} strokeWidth={1.5} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TradingHeader;
