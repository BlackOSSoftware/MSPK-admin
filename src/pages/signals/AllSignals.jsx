import React, { useEffect, useState } from 'react';
import { History, List, Plus, Search, Settings, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import SignalTable from '../../components/tables/SignalTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TablePageFooter from '../../components/ui/TablePageFooter';
import useToast from '../../hooks/useToast';
import SignalConfiguration from './SignalConfiguration';

const FEED_FILTERS = ['All', 'Active', 'Target Hit', 'Partial Profit Book', 'Stoploss Hit', 'Closed'];
const HISTORY_FILTERS = ['All', 'Closed', 'Target Hit', 'Partial Profit Book', 'Stoploss Hit'];
const SEGMENT_FILTERS = ['All', 'NSE', 'NFO', 'MCX', 'CURRENCY', 'CRYPTO'];
const normalizeTab = (tab) => (tab === 'live' ? 'feed' : tab);

const AllSignals = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState(normalizeTab(searchParams.get('tab') || 'feed'));
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState('All');
    const [segmentFilter, setSegmentFilter] = useState('All');
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState({
        totalSignals: 0,
        activeSignals: 0,
        closedSignals: 0,
        targetHit: 0,
        stoplossHit: 0,
        successRate: 0,
        partialProfit: 0,
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalResults: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    useEffect(() => {
        const tab = searchParams.get('tab');
        const search = searchParams.get('search');
        const normalizedTab = normalizeTab(tab);
        if (normalizedTab && ['feed', 'history', 'config'].includes(normalizedTab)) {
            setActiveTab(normalizedTab);
        }
        if (typeof search === 'string') {
            setSearchTerm(search);
        }
    }, [searchParams]);

    useEffect(() => {
        setStatusFilter('All');
    }, [activeTab]);

    const loadSignals = async (page = 1) => {
        if (activeTab === 'config') {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { fetchSignals } = await import('../../api/signals.api');
            const params = {
                page,
                limit: pagination.limit,
                search: searchTerm || undefined,
                segment: segmentFilter !== 'All' ? segmentFilter : undefined,
            };

            if (activeTab === 'history') {
                params.status = statusFilter === 'All' ? 'History' : statusFilter;
            } else if (statusFilter !== 'All') {
                params.status = statusFilter;
            }

            const { data } = await fetchSignals(params);
            setRows(Array.isArray(data?.results) ? data.results : []);

            if (data?.stats) {
                setStats((prev) => ({ ...prev, ...data.stats }));
            }

            if (data?.pagination) {
                setPagination((prev) => ({ ...prev, ...data.pagination }));
            } else {
                setPagination((prev) => ({ ...prev, page, totalPages: 1, totalResults: Array.isArray(data?.results) ? data.results.length : 0 }));
            }
        } catch (error) {
            console.error('Failed to load signals', error);
            toast.error('Failed to load signals');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'config') return undefined;

        const timer = setTimeout(() => {
            loadSignals(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [activeTab, searchTerm, statusFilter, segmentFilter, pagination.limit]);

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages) return;
        loadSignals(nextPage);
    };

    const handleAction = async (action, signal, payload) => {
        if (action === 'delete') {
            setPendingAction({ type: 'delete', signal });
            setDialogConfig({
                title: 'Delete Signal',
                message: `Delete ${signal.symbol} (${signal.uniqueId || signal.webhookId || signal.id}) permanently?`,
                variant: 'danger',
                confirmText: 'Delete',
            });
            setDialogOpen(true);
            return;
        }

        if (action === 'close') {
            setPendingAction({ type: 'close', signal });
            setDialogConfig({
                title: 'Force Close Signal',
                message: `This will move ${signal.symbol} into history with status Closed.`,
                variant: 'primary',
                confirmText: 'Close Signal',
            });
            setDialogOpen(true);
            return;
        }

        if (action === 'updateStatus') {
            try {
                const { updateSignal } = await import('../../api/signals.api');
                await updateSignal(signal.id, { status: payload });
                toast.success(`Signal marked as ${payload}`);
                loadSignals(pagination.page);
            } catch (error) {
                console.error('Failed to update signal status', error);
                toast.error('Failed to update signal status');
            }
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'delete') {
                const { deleteSignal } = await import('../../api/signals.api');
                await deleteSignal(pendingAction.signal.id);
                toast.success('Signal deleted');
            }

            if (pendingAction.type === 'close') {
                const { updateSignal } = await import('../../api/signals.api');
                await updateSignal(pendingAction.signal.id, { status: 'Closed' });
                toast.success('Signal closed');
            }

            setDialogOpen(false);
            setPendingAction(null);
            loadSignals(pagination.page);
        } catch (error) {
            console.error('Signal action failed', error);
            toast.error('Action failed');
            setDialogOpen(false);
        }
    };

    const handleRowClick = (signal) => {
        const strategyParam = signal.strategyId ? `&strategyId=${signal.strategyId}` : '';
        navigate(`/market/data?symbol=${signal.symbol}${strategyParam}`);
    };

    const currentFilters = activeTab === 'history' ? HISTORY_FILTERS : FEED_FILTERS;
    const emptyStateTitle = activeTab === 'history' ? 'No archived signals found' : 'No signals found';
    const emptyStateBody = activeTab === 'history'
        ? 'Try a different status, segment, or search term.'
        : 'Webhook and manual signals will appear here automatically.';

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex shrink-0 flex-col gap-4">
                <div className="flex items-center gap-1 border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab('feed')}
                        className={clsx(
                            'flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all',
                            activeTab === 'feed'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                        )}
                    >
                        <List size={14} /> All Signals
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            'flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all',
                            activeTab === 'history'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                        )}
                    >
                        <History size={14} /> Outcomes
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('config')}
                        className={clsx(
                            'flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all',
                            activeTab === 'config'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                        )}
                    >
                        <Settings size={14} /> Configuration
                    </button>
                </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
                {activeTab === 'config' ? (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <SignalConfiguration />
                    </div>
                ) : (
                    <div className="flex h-full flex-col gap-2">
                        <div className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                                            {activeTab === 'history' ? 'Signal Outcomes Archive' : 'Admin Signal Feed'}
                                        </h2>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            {activeTab === 'history'
                                                ? 'Closed, target-hit, partial-profit, and stoploss-hit signals with proper server pagination.'
                                                : 'Every webhook and manual signal is listed here, newest first.'}
                                        </p>
                                    </div>

                                    <div className="hidden h-8 w-px bg-border/70 xl:block" />

                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Total: <span className="text-foreground">{stats.totalSignals}</span>
                                        </span>
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Active: <span className="text-primary">{stats.activeSignals}</span>
                                        </span>
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Closed: <span className="text-amber-400">{stats.closedSignals}</span>
                                        </span>
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Success: <span className="text-emerald-400">{stats.successRate}%</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                        <input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            type="text"
                                            placeholder="Search symbol, uid, webhook..."
                                            className="h-8 w-64 rounded-lg border border-border bg-secondary/30 pl-9 pr-7 text-[11px] font-mono placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none"
                                        />
                                        {searchTerm ? (
                                            <button
                                                type="button"
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-2 top-2 text-muted-foreground transition-all hover:text-foreground"
                                            >
                                                <XCircle size={12} className="opacity-50 hover:opacity-100" />
                                            </button>
                                        ) : null}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/signals/create')}
                                        className="btn-cancel h-8 gap-1.5 rounded-lg text-[11px] font-bold"
                                    >
                                        <Plus size={12} /> New Signal
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</span>
                                    {currentFilters.map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setStatusFilter(value)}
                                            className={clsx(
                                                'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all',
                                                statusFilter === value
                                                    ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]'
                                                    : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                                            )}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Segment</span>
                                    {SEGMENT_FILTERS.map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setSegmentFilter(value)}
                                            className={clsx(
                                                'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all',
                                                segmentFilter === value
                                                    ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]'
                                                    : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                                            )}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative flex min-h-0 flex-1 flex-col">
                            <div className="relative min-h-0 flex-1">
                                <SignalTable
                                    signals={rows}
                                    onAction={handleAction}
                                    onRowClick={handleRowClick}
                                    isLoading={isLoading}
                                    highlightTerm={searchTerm}
                                />

                                {!isLoading && rows.length === 0 ? (
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 text-muted-foreground backdrop-blur-sm">
                                        <List size={44} strokeWidth={1} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold uppercase tracking-widest">{emptyStateTitle}</p>
                                            <p className="mt-1 text-[10px] font-mono">{emptyStateBody}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <TablePageFooter
                                total={pagination.totalResults}
                                overallTotal={stats.totalSignals}
                                page={pagination.page}
                                totalPages={pagination.totalPages || 1}
                                perPage={pagination.limit}
                                perPageOptions={[10, 20, 50]}
                                onPerPageChange={(value) => setPagination((prev) => ({ ...prev, limit: Number(value), page: 1 }))}
                                onPrev={() => handlePageChange(pagination.page - 1)}
                                onNext={() => handlePageChange(pagination.page + 1)}
                                rightExtra={
                                    <div className="hidden items-center gap-2 md:flex">
                                        <span>TP Hit: <span className="font-bold text-emerald-400">{stats.targetHit}</span></span>
                                        <span className="text-muted-foreground/40">|</span>
                                        <span>Partial: <span className="font-bold text-amber-400">{stats.partialProfit}</span></span>
                                        <span className="text-muted-foreground/40">|</span>
                                        <span>SL Hit: <span className="font-bold text-red-400">{stats.stoplossHit}</span></span>
                                    </div>
                                }
                            />
                        </div>
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
        </div>
    );
};

export default AllSignals;
