import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Check, TrendingUp, Globe, Bitcoin, Box, Activity } from 'lucide-react';
import { getSymbols, updateSymbol } from '../../api/market.api';
import useToast from '../../hooks/useToast';
import SymbolLogo from './SymbolLogo';

const TABS = [
    { id: 'ALL', label: 'All' },
    { id: 'STOCKS', label: 'Stocks' },
    { id: 'FUTURES', label: 'Futures' },
    { id: 'FOREX', label: 'Forex' },
    { id: 'CRYPTO', label: 'Crypto' },
    { id: 'INDICES', label: 'Indices' },
];

const mapSegmentToTab = (segment) => {
    if (!segment) return 'OTHERS';
    const s = segment.toUpperCase();
    if (s.includes('CRYPTO') || s.includes('BINANCE')) return 'CRYPTO';
    if (s.includes('FUT') || s.includes('MCX') || s.includes('DERIVATIVE')) return 'FUTURES';
    if (s.includes('FOREX') || s.includes('CUR') || s.includes('FX')) return 'FOREX';
    if (s.includes('EQ') || s.includes('NSE') || s.includes('BSE')) return 'STOCKS';
    if (s.includes('INDEX') || s.includes('INDICES')) return 'INDICES';
    return 'OTHERS';
};

const SymbolSearchModal = ({ isOpen, onClose, onSelect, mode = 'VIEW' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [allSymbols, setAllSymbols] = useState([]);
    const [filteredSymbols, setFilteredSymbols] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const toast = useToast();

    // Load all master symbols on open
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            loadSymbols();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Filtering Logic (Search + Tabs)
    useEffect(() => {
        let result = allSymbols;

        // 1. Tab Filter
        if (activeTab !== 'ALL') {
            result = result.filter(s => mapSegmentToTab(s.segment) === activeTab);
        }

        // 2. Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.symbol.toLowerCase().includes(lower) ||
                (s.name && s.name.toLowerCase().includes(lower))
            );
        }

        setFilteredSymbols(result.slice(0, 100)); // Limit for performance
    }, [searchTerm, activeTab, allSymbols]);

    const loadSymbols = async () => {
        setLoading(true);
        try {
            const data = await getSymbols(); // Fetch Master Inventory
            setAllSymbols(data);
            setFilteredSymbols(data.slice(0, 50));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e, symbol) => {
        e.stopPropagation();

        if (mode === 'ADD') {
            // Toggle Watchlist
            const newStatus = !symbol.isWatchlist;
            try {
                // Optimistic Update
                setAllSymbols(prev => prev.map(s => s._id === symbol._id ? { ...s, isWatchlist: newStatus } : s));

                await updateSymbol(symbol._id, { isWatchlist: newStatus });

                if (newStatus) toast.success(`${symbol.symbol} added to Watchlist`);
                else toast.info(`${symbol.symbol} removed from Watchlist`);

                if (onSelect) onSelect(symbol); // Trigger sidebar refresh if needed
            } catch (err) {
                toast.error("Failed to update watchlist");
                loadSymbols(); // Revert
            }
        } else {
            // View Mode: Just select
            onSelect(symbol);
            onClose();
        }
    };

    const handleRowClick = (symbol) => {
        // If mode is ADD, clicking row ALSO toggles.
        // If mode is VIEW, clicking row selects it.
        handleAction({ stopPropagation: () => { } }, symbol);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans p-4">
            <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh] md:h-[600px]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">
                        {mode === 'ADD' ? 'Add symbol' : 'Symbol Search'}
                    </h2>
                    <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition">
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-border bg-card">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30 border border-border/50 rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                        <Search className="text-muted-foreground" size={20} strokeWidth={1.5} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Symbol, Description, ISIN..."
                            className="flex-1 bg-transparent border-none outline-none text-base font-medium text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                    ${activeTab === tab.id
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List Header */}
                <div className="flex items-center px-6 py-2 border-b border-border bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex-1">Symbol</div>
                    <div className="w-24 text-right">Exc</div>
                    <div className="w-24 text-center">Type</div>
                    <div className="w-12 text-center">Action</div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                            <Activity className="animate-spin" size={24} />
                            <span className="text-sm font-medium">Loading symbols...</span>
                        </div>
                    ) : filteredSymbols.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Box size={40} strokeWidth={1} className="mb-2 opacity-50" />
                            <span className="text-sm">No symbols found for "{searchTerm}"</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {filteredSymbols.map(sym => {
                                const isAdded = sym.isWatchlist;

                                return (
                                    <div
                                        key={sym._id}
                                        onClick={() => handleRowClick(sym)}
                                        className="flex items-center px-4 py-3 hover:bg-muted/40 cursor-pointer group transition-colors duration-150"
                                    >
                                        {/* Logo & Info */}
                                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                            <SymbolLogo symbol={sym.symbol} size={36} className="flex-none shadow-sm" />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-bold text-foreground truncate">{sym.symbol}</span>
                                                <span className="text-xs text-muted-foreground truncate">{sym.name || sym.description || sym.symbol}</span>
                                            </div>
                                        </div>

                                        {/* Exchange Badge */}
                                        <div className="w-24 text-right flex items-center justify-end">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-muted-foreground border border-border/50 uppercase">
                                                {sym.segment?.split('-')[0] || 'OTC'}
                                            </span>
                                        </div>

                                        {/* Type/Segment Badge */}
                                        <div className="w-24 text-center hidden sm:block">
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase truncate px-2">
                                                {mapSegmentToTab(sym.segment)}
                                            </span>
                                        </div>

                                        {/* Add/Remove Action */}
                                        <div className="w-12 flex justify-center">
                                            <button
                                                onClick={(e) => handleAction(e, sym)}
                                                className={`p-1.5 rounded-md transition-all duration-200 border
                                                    ${mode === 'ADD'
                                                        ? (isAdded
                                                            ? 'text-red-500 border-red-500/20 bg-red-500/10 hover:bg-red-500/20'
                                                            : 'text-muted-foreground border-border hover:border-primary hover:text-primary hover:bg-primary/10'
                                                        )
                                                        : 'text-muted-foreground hover:bg-accent'
                                                    }
                                                `}
                                                title={mode === 'ADD' ? (isAdded ? "Remove from Watchlist" : "Add to Watchlist") : "View Chart"}
                                            >
                                                {mode === 'ADD' ? (
                                                    isAdded ? <X size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />
                                                ) : (
                                                    <TrendingUp size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SymbolSearchModal;
