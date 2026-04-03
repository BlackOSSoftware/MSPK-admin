import React, { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Plus,
    BarChart2,
    List,
    Settings,
    Sparkles,
    CheckCircle,
    KeyRound,
    RefreshCw,
    Database,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketTable from '../../components/tables/MarketTable';
import Button from '../../components/ui/Button';
import DataFeedConfig from './DataFeedConfig';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { deleteSymbol, generateSymbolId, getSegments, getSymbols, updateTradingViewStatus } from '../../api/market.api';
import useToast from '../../hooks/useToast';
import TablePageFooter from '../../components/ui/TablePageFooter';

const DEFAULT_PAGINATION = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
};

const DEFAULT_SUMMARY = {
    total: 0,
    active: 0,
    inactive: 0,
    withSymbolId: 0,
    withoutSymbolId: 0,
    tradingViewAdded: 0,
    matched: 0,
};

const filterInputClassName = "h-10 rounded-xl border border-border/70 bg-secondary/30 px-3 text-xs font-semibold text-foreground outline-none transition focus:border-primary/50 focus:bg-secondary/50";

const normalizeSegmentValue = (value) => String(value ?? '').trim().toUpperCase();

const ManageSymbols = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState('scripts');
    const [symbols, setSymbols] = useState([]);
    const [segments, setSegments] = useState([]);
    const [summary, setSummary] = useState(DEFAULT_SUMMARY);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loadingSymbols, setLoadingSymbols] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [segmentFilter, setSegmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [idFilter, setIdFilter] = useState('all');
    const [reloadToken, setReloadToken] = useState(0);
    const [generatingIdFor, setGeneratingIdFor] = useState('');
    const [togglingTradingViewFor, setTogglingTradingViewFor] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, data: null });

    const segmentOptions = useMemo(() => {
        const unique = new Map();
        (Array.isArray(segments) ? segments : []).forEach((segment) => {
            const rawValue = segment?.code ?? segment?.segment_code ?? segment?.segmentCode ?? segment?.segment ?? segment?.name;
            const value = normalizeSegmentValue(rawValue);
            if (!value || unique.has(value)) return;
            unique.set(value, {
                value,
                label: segment?.name || segment?.code || segment?.segment_code || segment?.segment || value,
            });
        });
        return Array.from(unique.values());
    }, [segments]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setCurrentPage(1);
            setDebouncedSearch(searchTerm.trim());
        }, 350);

        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const loadSegments = async () => {
            try {
                const data = await getSegments();
                setSegments(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load segments', error);
                toast.error('Failed to load segments');
            }
        };

        loadSegments();
    }, [toast]);

    useEffect(() => {
        if (activeTab !== 'scripts') return;

        const loadSymbols = async () => {
            setLoadingSymbols(true);
            try {
                const response = await getSymbols({
                    paginated: 'true',
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearch,
                    segment: segmentFilter,
                    isActive: statusFilter === 'all' ? undefined : statusFilter,
                    hasSymbolId: idFilter === 'all' ? undefined : idFilter,
                });

                setSymbols(Array.isArray(response?.results) ? response.results : []);
                setPagination(response?.pagination || DEFAULT_PAGINATION);
                setSummary(response?.summary || DEFAULT_SUMMARY);
                if (response?.pagination?.page && response.pagination.page !== currentPage) {
                    setCurrentPage(response.pagination.page);
                }
            } catch (error) {
                console.error('Failed to load market data', error);
                toast.error('Failed to load symbols');
            } finally {
                setLoadingSymbols(false);
            }
        };

        loadSymbols();
    }, [activeTab, currentPage, itemsPerPage, debouncedSearch, segmentFilter, statusFilter, idFilter, reloadToken, toast]);

    const handleDeleteClick = (symbol) => {
        setDeleteModal({ isOpen: true, data: symbol });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.data?._id) return;

        try {
            await deleteSymbol(deleteModal.data._id);
            toast.success(`Deleted ${deleteModal.data.symbol} successfully`);
            setDeleteModal({ isOpen: false, data: null });

            if (symbols.length === 1 && currentPage > 1) {
                setCurrentPage((page) => Math.max(1, page - 1));
                return;
            }

            setReloadToken((value) => value + 1);
        } catch (error) {
            console.error('Failed to delete symbol', error);
            const msg = error.response?.data?.message || 'Failed to delete symbol';
            toast.error(msg);
        }
    };

    const handleGenerateSymbolId = async (symbol) => {
        if (!symbol?._id) return;

        setGeneratingIdFor(symbol._id);
        try {
            const updated = await generateSymbolId(symbol._id);
            toast.success(`${updated.symbol} webhook ID is ready`);
            setReloadToken((value) => value + 1);
        } catch (error) {
            console.error('Failed to generate symbol ID', error);
            const msg = error.response?.data?.message || 'Failed to generate symbol ID';
            toast.error(msg);
        } finally {
            setGeneratingIdFor('');
        }
    };

    const handleToggleTradingView = async (symbol) => {
        if (!symbol?._id) return;

        const nextState = !Boolean(symbol.tradingViewAdded);
        setTogglingTradingViewFor(symbol._id);
        try {
            await updateTradingViewStatus(symbol._id, nextState);
            toast.success(nextState ? `${symbol.symbol} marked as TV added` : `${symbol.symbol} marked as TV not added`);
            setReloadToken((value) => value + 1);
        } catch (error) {
            console.error('Failed to update TradingView status', error);
            const msg = error.response?.data?.message || 'Failed to update TradingView status';
            toast.error(msg);
        } finally {
            setTogglingTradingViewFor('');
        }
    };

    const toneStyles = {
        emerald: { box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', bar: 'bg-emerald-500/70' },
        primary: { box: 'bg-primary/10 border-primary/20', text: 'text-primary', bar: 'bg-primary/70' },
        amber: { box: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', bar: 'bg-amber-500/70' },
        rose: { box: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-500', bar: 'bg-rose-500/70' },
        sky: { box: 'bg-sky-500/10 border-sky-500/20', text: 'text-sky-500', bar: 'bg-sky-500/70' }
    };

    const overviewCards = [
        { label: 'Total Scripts', value: summary.total, icon: Database, tone: 'primary' },
        { label: 'Active', value: summary.active, icon: CheckCircle, tone: 'emerald' },
        { label: 'Missing IDs', value: summary.withoutSymbolId, icon: KeyRound, tone: 'amber' },
        { label: 'Matched', value: summary.matched, icon: BarChart2, tone: 'sky' },
    ];

    return (
        <div className="h-full flex flex-col gap-4">
            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, data: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Script?"
                message={`Are you sure you want to delete ${deleteModal.data?.symbol}? This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
            />

            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('scripts')}
                        className={`px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${activeTab === 'scripts'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                    >
                        <List size={14} /> Script Master
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${activeTab === 'config'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                    >
                        <Settings size={14} /> Data Feed Config
                    </button>
                </div>

                {activeTab === 'scripts' && (
                    <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-3 sm:p-4">
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                                    <Sparkles size={16} className="text-primary" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Inventory</p>
                                    <h2 className="text-sm sm:text-base font-bold text-foreground">Script Registry</h2>
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                                Futures auto-roll: SEGMENT-EXCHANGE-ROOT-CURRENT
                            </div>
                        </div>

                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
                            {overviewCards.map((card) => {
                                const tone = toneStyles[card.tone] || toneStyles.primary;
                                return (
                                    <div
                                        key={card.label}
                                        className="rounded-2xl border border-border/70 bg-card/70 p-2.5 sm:p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">{card.label}</p>
                                                <p className="text-base sm:text-lg font-bold mt-0.5 text-foreground">{card.value}</p>
                                            </div>
                                            <div className={`h-8 w-8 rounded-lg border grid place-items-center ${tone.box}`}>
                                                <card.icon size={14} className={tone.text} />
                                            </div>
                                        </div>
                                        <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-secondary/50">
                                            <div className={`h-full ${tone.bar}`} style={{ width: '72%' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 relative flex flex-col">
                {activeTab === 'scripts' && (
                    <div className="flex flex-col h-full gap-2">
                        <div className="flex flex-col gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                                            <Database size={16} className="text-primary" />
                                        </div>
                                        <div className="leading-tight">
                                            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Scripts</p>
                                            <h2 className="text-sm sm:text-base font-bold text-foreground">Search, filter, and manage all symbols</h2>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <span className="text-muted-foreground font-medium">Results:</span>
                                        <span className="text-foreground font-bold">{pagination.total}</span>
                                        <span className="text-muted-foreground/50">|</span>
                                        <span className="text-muted-foreground font-medium">Ready IDs:</span>
                                        <span className="text-foreground font-bold">{summary.withSymbolId}</span>
                                        <span className="text-muted-foreground/50">|</span>
                                        <span className="text-muted-foreground font-medium">TV Added:</span>
                                        <span className="text-foreground font-bold">{summary.tradingViewAdded}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full xl:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-[10px] border-border gap-1.5 rounded-lg hover:border-primary/50"
                                        onClick={() => setReloadToken((value) => value + 1)}
                                    >
                                        <RefreshCw size={12} /> Refresh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/market/add')}
                                        className="h-9 text-[10px] gap-1.5 rounded-lg font-bold btn-cancel"
                                    >
                                        <Plus size={12} /> Add Symbol
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-muted-foreground" size={14} />
                                    <input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        type="text"
                                        placeholder="Search by symbol, name, symbol ID, or Mongo ID"
                                        className={`${filterInputClassName} w-full pl-10 font-mono placeholder:text-muted-foreground/50`}
                                    />
                                </div>

                                <select
                                    value={segmentFilter}
                                    onChange={(event) => {
                                        setSegmentFilter(normalizeSegmentValue(event.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className={filterInputClassName}
                                >
                                    <option value="">All Segments</option>
                                    {segmentOptions.map((segment) => (
                                        <option key={segment.value} value={segment.value}>
                                            {segment.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className={filterInputClassName}
                                >
                                    <option value="all">All Status</option>
                                    <option value="true">Active Only</option>
                                    <option value="false">Inactive Only</option>
                                </select>

                                <select
                                    value={idFilter}
                                    onChange={(event) => {
                                        setIdFilter(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className={filterInputClassName}
                                >
                                    <option value="all">All ID Status</option>
                                    <option value="true">With Symbol ID</option>
                                    <option value="false">Missing Symbol ID</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <div className="flex-1 min-h-[620px] relative">
                                <MarketTable
                                    symbols={symbols}
                                    onEdit={(symbol) => navigate('/market/edit', { state: { symbol } })}
                                    onDelete={handleDeleteClick}
                                    onGenerateId={handleGenerateSymbolId}
                                    onToggleTradingView={handleToggleTradingView}
                                    generatingIdFor={generatingIdFor}
                                    togglingTradingViewFor={togglingTradingViewFor}
                                    isLoading={loadingSymbols}
                                />

                                {!loadingSymbols && symbols.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-60 bg-card/80 backdrop-blur-sm pointer-events-none">
                                        <BarChart2 size={48} strokeWidth={1} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold uppercase tracking-widest">No Scripts Found</p>
                                            <p className="text-[10px] font-mono mt-1">Try another search term or reset filters</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 mt-2">
                                <TablePageFooter
                                    total={pagination.total}
                                    overallTotal={summary.total}
                                    page={pagination.page}
                                    totalPages={pagination.totalPages}
                                    perPage={itemsPerPage}
                                    perPageOptions={[20, 50, 100]}
                                    onPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                    onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    onNext={() => setCurrentPage((page) => Math.min(pagination.totalPages || 1, page + 1))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <DataFeedConfig />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageSymbols;
