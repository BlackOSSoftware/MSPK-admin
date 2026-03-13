import React, { useState, useEffect } from 'react';
import { Search, Plus, Radio, Download, List, XCircle, History, Settings, TrendingUp } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SignalTable from '../../components/tables/SignalTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import { clsx } from 'clsx';
import SignalConfiguration from './SignalConfiguration';
import TablePageFooter from '../../components/ui/TablePageFooter';

const AllSignals = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    // Removed targetId logic since we now filter by search term which returns all results

    // Sync activeTab and Search Targets with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        const sTerm = searchParams.get('search');
        if (tab && ['live', 'history', 'config'].includes(tab)) {
            setActiveTab(tab);
        }
        if (sTerm) setSearchTerm(sTerm);

    }, [searchParams]);
    const [filter, setFilter] = useState('All'); // Status filter
    const [segmentFilter, setSegmentFilter] = useState('All'); // Segment filter
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'live'); // live, history, config

    const [signals, setSignals] = useState([]);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ totalSignals: 0, successRate: 0, activeSignals: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalResults: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Dialog States
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    // Load Signals
    const loadSignals = async (page = 1) => {
        setIsLoading(true);
        try {
            const { fetchSignals } = await import('../../api/signals.api');

            // Prepare Params
            const params = {
                page,
                limit: pagination.limit,
                search: searchTerm,
                // If in Live tab, default to showing everything EXCEPT Closed, unless specific filter selected.
                // If in History tab, force status='Closed'.
                // Backend 'status' filter usually performs exact match. 
                // We might need to handle 'Not Closed' logic in backend or filter locally if backend returns mixed.
                // For now, let's assume backend returns all and we filter, OR we send specific params.
                // BETTER: Update backend to support status='active_only' or similar.
                // CURRENT: Passing status if selected.
                status: activeTab === 'history' ? 'Closed' : (filter !== 'All' ? filter : '!Closed'),
                segment: activeTab === 'live' && segmentFilter !== 'All' ? segmentFilter : undefined,
                // Removed signalId: targetId
            };

            const { data } = await fetchSignals(params);

            // Access response structure: { results, pagination, stats }
            // With server-side filtering, 'results' contains exactly what we want to show.
            // If activeTab is Live, data.results will act as 'signals'.
            // If activeTab is History, data.results will act as 'history'.

            if (activeTab === 'live') {
                // If we are in Live tab, we might still get 'Closed' if logic isn't perfect, but let's assume backend handles it or we accept it.
                // Actually, if we didn't pass status='Closed', backend returns all mixed.
                // We need to filter 'Closed' out of Live view if pagination is server side?
                // PROBLEM: Pagination breakdown if we filter locally.
                // FIX: Let's assume for now we see ALL in live tab if filter is All, including closed, or update backend query to exclude closed by default if no status provided?
                // Let's filter locally for now to be safe, but this messes up pagination count.
                // Ideally backend should handle "Active Only".
                // Let's blindly set the results to the current view's list.
                setSignals(data.results);
            } else {
                setHistory(data.results);
            }

            if (data.stats) {
                setStats(data.stats);
            }

            if (data.pagination) {
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }

        } catch (e) {
            console.error("Failed to load signals", e);
            toast.error("Failed to load signals");
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce Search & Filter Effects
    useEffect(() => {
        const timer = setTimeout(() => {
            loadSignals(1); // Reset to page 1 on filter change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filter, segmentFilter, activeTab, pagination.limit]); // Added pagination.limit dependency

    // Handle Page Change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadSignals(newPage);
        }
    };

    const handleAction = async (action, signal, payload) => {
        if (action === 'edit') {
            navigate(`/signals/edit?id=${signal.id}`);
        }
        else if (action === 'delete') {
            setPendingAction({ type: 'delete', signal });
            setDialogConfig({
                title: 'Delete Signal',
                message: `Are you sure you want to delete signal for ${signal.symbol}? This action cannot be undone.`,
                variant: 'danger',
                confirmText: 'Delete'
            });
            setDialogOpen(true);
        }
        else if (action === 'updateStatus') {
            try {
                const { updateSignal } = await import('../../api/signals.api');
                await updateSignal(signal.id, { status: payload });
                toast.success(`Signal marked as ${payload}`);
                loadSignals(pagination.page); // Refresh current page
            } catch (e) {
                toast.error("Failed to update status");
            }
        }
        else if (action === 'close') {
            setPendingAction({ type: 'close', signal });
            setDialogConfig({
                title: 'Close Position',
                message: `This will move ${signal.symbol} to history. Ensure you have broadcasted the exit.`,
                variant: 'primary',
                confirmText: 'Close Position'
            });
            setDialogOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'delete') {
                const { deleteSignal } = await import('../../api/signals.api');
                await deleteSignal(pendingAction.signal.id);
                toast.success('Signal deleted successfully');
            }
            else if (pendingAction.type === 'close') {
                const { updateSignal } = await import('../../api/signals.api');
                await updateSignal(pendingAction.signal.id, { status: 'Closed' });
                toast.success('Signal closed and moved to history');
            }
            loadSignals(pagination.page);
            setDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Action failed");
            setDialogOpen(false);
        }
    };

    const handleRowClick = (signal) => {
        const strategyParam = signal.strategyId ? `&strategyId=${signal.strategyId}` : '';
        navigate(`/market/data?symbol=${signal.symbol}${strategyParam}`);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'live'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <TrendingUp size={14} /> Live Signals
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'history'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <History size={14} /> Signal History
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'config'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Settings size={14} /> Configuration
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative flex flex-col">
                {activeTab === 'live' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <Radio size={16} className="text-primary" />
                                    Signal Terminal
                                </h2>

                                <div className="h-6 w-[1px] bg-white/10"></div>

                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground font-medium">Filter:</span>
                                    {['All', 'Active', 'Target Hit', 'Stoploss Hit'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all uppercase tracking-wide ${filter === f ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]' : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH SYMBOL..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-7 w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            <XCircle size={12} className="opacity-50 hover:opacity-100" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/signals/create')}
                                    className="h-8 text-[11px] gap-1.5 rounded-lg font-bold btn-cancel"
                                >
                                    <Plus size={12} /> New Signal
                                </Button>
                            </div>
                        </div>

                        {/* Table Area */}
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <div className="flex-1 min-h-0 relative">
                                <SignalTable signals={signals} onAction={handleAction} onRowClick={handleRowClick} isLoading={isLoading} highlightTerm={searchTerm} />

                                {!isLoading && signals.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                        <Radio size={48} strokeWidth={1} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold uppercase tracking-widest">No Active Signals</p>
                                            <p className="text-[10px] font-mono mt-1">Create a new signal to get started</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <TablePageFooter
                                total={pagination.totalResults}
                                page={pagination.page}
                                totalPages={pagination.totalPages || 1}
                                perPage={pagination.limit}
                                perPageOptions={[10, 20, 50]}
                                onPerPageChange={(value) => {
                                    setPagination(prev => ({ ...prev, limit: Number(value), page: 1 }));
                                }}
                                onPrev={() => handlePageChange(pagination.page - 1)}
                                onNext={() => handlePageChange(pagination.page + 1)}
                                rightExtra={
                                    <div className="hidden md:flex items-center gap-2">
                                        <span>Success Rate: <span className="text-emerald-500 font-bold">{stats.successRate}%</span></span>
                                        <span className="text-muted-foreground/40">|</span>
                                        <span>Active: <span className="text-blue-500 font-bold">{stats.activeSignals}</span></span>
                                    </div>
                                }
                            />
                        </div>

                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* History Toolbar */}
                        <div className="flex items-center justify-between shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <History size={16} />
                                    Archive
                                </h2>
                                <div className="h-6 w-[1px] bg-white/10"></div>
                                <div className="text-xs text-muted-foreground">
                                    Total Closed: <span className="text-foreground font-bold">{stats.closedSignals}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH ARCHIVE..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-3 w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <div className="flex-1 min-h-0 relative">
                                <SignalTable signals={history} onAction={handleAction} onRowClick={handleRowClick} isLoading={isLoading} highlightTerm={searchTerm} />

                                {!isLoading && history.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                        <History size={48} strokeWidth={1} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold uppercase tracking-widest">No History Found</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <TablePageFooter
                                total={pagination.totalResults}
                                page={pagination.page}
                                totalPages={pagination.totalPages || 1}
                                perPage={pagination.limit}
                                perPageOptions={[10, 20, 50]}
                                onPerPageChange={(value) => setPagination(prev => ({ ...prev, limit: Number(value), page: 1 }))}
                                onPrev={() => handlePageChange(pagination.page - 1)}
                                onNext={() => handlePageChange(pagination.page + 1)}
                            />
                        </div>

                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <SignalConfiguration />
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={confirmAction}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                confirmVariant={dialogConfig.variant}
            />
        </div >
    );
};

export default AllSignals;
