import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, History, List, Plus, Search, Settings, TrendingUp, XCircle } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import SignalTable from '../../components/tables/SignalTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TablePageFooter from '../../components/ui/TablePageFooter';
import useToast from '../../hooks/useToast';
import SignalConfiguration from './SignalConfiguration';
import SignalDetailsDrawer from './SignalDetailsDrawer';

const FEED_FILTERS = ['All', 'Active', 'Target Hit', 'Partial Profit Book', 'Stoploss Hit', 'Closed'];
const HISTORY_FILTERS = ['All', 'Closed', 'Target Hit', 'Partial Profit Book', 'Stoploss Hit'];
const SEGMENT_FILTERS = ['All', 'NSE', 'NFO', 'MCX', 'FOREX', 'CRYPTO'];
const DATE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
];
const normalizeTab = (tab) => (tab === 'live' ? 'feed' : tab);
const EMPTY_REPORT_SUMMARY = {
    totalSignals: 0,
    closedSignals: 0,
    activeSignals: 0,
    positiveSignals: 0,
    negativeSignals: 0,
    neutralSignals: 0,
    grossProfitPoints: 0,
    grossLossPoints: 0,
    netPoints: 0,
    averagePoints: 0,
    grossProfitInr: 0,
    grossLossInr: 0,
    netInr: 0,
    averageInr: 0,
    winRate: 0,
    closedWithoutPoints: 0,
    targetHit: 0,
    partialProfit: 0,
    stoplossHit: 0,
    lotSizeMissing: 0,
};
const EMPTY_DETAIL_STATS = {
    totalSignals: 0,
    activeSignals: 0,
    closedSignals: 0,
    targetHit: 0,
    stoplossHit: 0,
    successRate: 0,
    partialProfit: 0,
};
const EMPTY_DETAIL_PAGINATION = { page: 1, limit: 100, totalPages: 1, totalResults: 0 };

const mapSegmentFilterToApi = (value) => {
    if (value === 'FOREX') return 'CURRENCY';
    if (value === 'MCX') return 'MCX';
    return value !== 'All' ? value : undefined;
};

const AllSignals = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState(normalizeTab(searchParams.get('tab') || 'feed'));
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState('All');
    const [segmentFilter, setSegmentFilter] = useState('All');
    const [datePreset, setDatePreset] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
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
    const [periodStats, setPeriodStats] = useState({
        todaySignals: 0,
        tomorrowSignals: 0,
        weeklySignals: 0,
        monthlySignals: 0,
    });
    const [reportSummary, setReportSummary] = useState(EMPTY_REPORT_SUMMARY);
    const [hasReportSummary, setHasReportSummary] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, totalResults: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });
    const [selectedSignal, setSelectedSignal] = useState(null);
    const [signalDetail, setSignalDetail] = useState(null);
    const [detailRows, setDetailRows] = useState([]);
    const [detailStats, setDetailStats] = useState(EMPTY_DETAIL_STATS);
    const [detailReportSummary, setDetailReportSummary] = useState(EMPTY_REPORT_SUMMARY);
    const [detailPagination, setDetailPagination] = useState(EMPTY_DETAIL_PAGINATION);
    const [detailError, setDetailError] = useState('');
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const detailRequestRef = useRef(0);

    useEffect(() => {
        const tab = searchParams.get('tab');
        const search = searchParams.get('search');
        const normalizedTab = normalizeTab(tab);
        if (normalizedTab && ['feed', 'history', 'config'].includes(normalizedTab)) {
            setActiveTab(normalizedTab);
        }
        if (typeof search === 'string') {
            setSearchTerm(search);
            setSearchInput(search);
        }
    }, [searchParams]);

    useEffect(() => {
        setStatusFilter('All');
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadSignals = useCallback(async (page = 1) => {
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
                includeReport: 1,
                search: searchTerm || undefined,
                segment: mapSegmentFilterToApi(segmentFilter),
                datePreset: datePreset !== 'all' ? datePreset : undefined,
                fromDate: datePreset === 'custom' ? (fromDate || undefined) : undefined,
                toDate: datePreset === 'custom' ? (toDate || undefined) : undefined,
            };

            if (activeTab === 'history') {
                params.status = statusFilter === 'All' ? 'History' : statusFilter;
            } else if (statusFilter !== 'All') {
                params.status = statusFilter;
            }

            const { data } = await fetchSignals(params);
            const nextRows = Array.isArray(data?.results) ? data.results : [];
            setRows(nextRows);

            if (data?.stats) {
                setStats((prev) => ({ ...prev, ...data.stats }));
            }

            if (data?.periodStats) {
                setPeriodStats((prev) => ({ ...prev, ...data.periodStats }));
            }

            if (data?.report?.summary) {
                setReportSummary((prev) => ({ ...prev, ...data.report.summary }));
                setHasReportSummary(true);
            } else {
                setReportSummary(EMPTY_REPORT_SUMMARY);
                setHasReportSummary(false);
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
    }, [activeTab, pagination.limit, searchTerm, segmentFilter, datePreset, fromDate, toDate, statusFilter, toast]);

    const exportParams = useMemo(() => {
        const params = {
            search: searchTerm || undefined,
            segment: mapSegmentFilterToApi(segmentFilter),
            datePreset: datePreset !== 'all' ? datePreset : undefined,
            fromDate: datePreset === 'custom' ? (fromDate || undefined) : undefined,
            toDate: datePreset === 'custom' ? (toDate || undefined) : undefined,
        };

        if (activeTab === 'history') {
            params.status = statusFilter === 'All' ? 'History' : statusFilter;
        } else if (statusFilter !== 'All') {
            params.status = statusFilter;
        }

        return params;
    }, [activeTab, datePreset, fromDate, searchTerm, segmentFilter, statusFilter, toDate]);

    const handleExportReport = async () => {
        try {
            setIsExporting(true);
            const { exportSignalReport } = await import('../../api/signals.api');
            await exportSignalReport(exportParams);
            toast.success('Signal report export started');
        } catch (error) {
            console.error('Failed to export signal report', error);
            toast.error('Failed to export signal report');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'config') return undefined;

        const timer = setTimeout(() => {
            loadSignals(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [activeTab, loadSignals]);

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages) return;
        loadSignals(nextPage);
    };

    const closeSignalDetails = useCallback(() => {
        setSelectedSignal(null);
        setSignalDetail(null);
        setDetailRows([]);
        setDetailStats(EMPTY_DETAIL_STATS);
        setDetailReportSummary(EMPTY_REPORT_SUMMARY);
        setDetailPagination(EMPTY_DETAIL_PAGINATION);
        setDetailError('');
        setIsDetailLoading(false);
    }, []);

    const openSignalDetails = useCallback(async (signal) => {
        if (!signal?.id) return;

        const requestId = detailRequestRef.current + 1;
        detailRequestRef.current = requestId;

        setSelectedSignal(signal);
        setSignalDetail(null);
        setDetailRows([]);
        setDetailStats(EMPTY_DETAIL_STATS);
        setDetailReportSummary(EMPTY_REPORT_SUMMARY);
        setDetailPagination(EMPTY_DETAIL_PAGINATION);
        setDetailError('');
        setIsDetailLoading(true);

        try {
            const { fetchSignal, fetchSignals } = await import('../../api/signals.api');
            const historyParams = {
                symbol: signal.sourceSymbol || signal.symbol,
                timeframe: signal.timeframe,
                includeReport: 1,
                page: 1,
                limit: 100,
                sortBy: 'latest-event',
            };

            const [detailResponse, historyResponse] = await Promise.all([
                fetchSignal(signal.id),
                fetchSignals(historyParams),
            ]);

            if (detailRequestRef.current !== requestId) return;

            setSignalDetail(detailResponse?.data || signal);
            setDetailRows(Array.isArray(historyResponse?.data?.results) ? historyResponse.data.results : []);
            setDetailStats(historyResponse?.data?.stats || EMPTY_DETAIL_STATS);
            setDetailReportSummary(historyResponse?.data?.report?.summary || EMPTY_REPORT_SUMMARY);
            setDetailPagination(historyResponse?.data?.pagination || EMPTY_DETAIL_PAGINATION);
        } catch (error) {
            console.error('Failed to load signal details', error);
            if (detailRequestRef.current !== requestId) return;
            setSignalDetail(signal);
            setDetailError('Signal detail load nahi ho paya. Table data dikh raha hai, history retry ki ja sakti hai.');
        } finally {
            if (detailRequestRef.current === requestId) {
                setIsDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'config') {
            closeSignalDetails();
        }
    }, [activeTab, closeSignalDetails]);

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

        if (action === 'reopen') {
            setPendingAction({ type: 'reopen', signal });
            setDialogConfig({
                title: 'Return Signal To Active',
                message: `Return ${signal.symbol} to Active? This will clear exit time, exit price, points, and close outcome so the signal becomes live again.`,
                variant: 'primary',
                confirmText: 'Return Active',
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

            if (pendingAction.type === 'reopen') {
                const { updateSignal } = await import('../../api/signals.api');
                await updateSignal(pendingAction.signal.id, { status: 'Active' });
                toast.success('Signal returned to Active');
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

    const handleRowClick = useCallback((signal) => {
        const signalId = signal?.id || signal?._id;
        if (!signalId) return;

        navigate(`/signals/report?id=${encodeURIComponent(String(signalId))}`, {
            state: {
                from: `${location.pathname}${location.search}`,
            },
        });
    }, [location.pathname, location.search, navigate]);

    const handleOpenReportFromDetail = useCallback(() => {
        const activeSignal = signalDetail || selectedSignal;
        if (!activeSignal) return;

        const signalId = activeSignal.id || activeSignal._id;
        if (!signalId) return;

        navigate(`/signals/report?id=${encodeURIComponent(String(signalId))}`, {
            state: {
                from: `${location.pathname}${location.search}`,
            },
        });
    }, [location.pathname, location.search, navigate, selectedSignal, signalDetail]);

    const currentFilters = activeTab === 'history' ? HISTORY_FILTERS : FEED_FILTERS;
    const emptyStateTitle = activeTab === 'history' ? 'No archived signals found' : 'No signals found';
    const emptyStateBody = activeTab === 'history'
        ? 'Try a different status, segment, or search term.'
        : 'Webhook and manual signals will appear here automatically.';
    const accuracyPercent = hasReportSummary && reportSummary.closedSignals > 0
        ? Math.max(0, Math.round(((reportSummary.closedSignals - reportSummary.lotSizeMissing) / reportSummary.closedSignals) * 100))
        : null;

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
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Today: <span className="text-sky-400">{periodStats.todaySignals}</span>
                                        </span>
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Weekly: <span className="text-cyan-400">{periodStats.weeklySignals}</span>
                                        </span>
                                        <span className="rounded-full border border-border/70 bg-muted/10 px-2.5 py-1">
                                            Monthly: <span className="text-violet-400">{periodStats.monthlySignals}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                        <input
                                            value={searchInput}
                                            onChange={(event) => setSearchInput(event.target.value)}
                                            type="text"
                                            placeholder="Search symbol, uid, webhook..."
                                            className="h-8 w-64 rounded-lg border border-border bg-secondary/30 pl-9 pr-7 text-[11px] font-mono placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none"
                                        />
                                        {searchInput ? (
                                            <button
                                                type="button"
                                                onClick={() => setSearchInput('')}
                                                className="absolute right-2 top-2 text-muted-foreground transition-all hover:text-foreground"
                                            >
                                                <XCircle size={12} className="opacity-50 hover:opacity-100" />
                                            </button>
                                        ) : null}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportReport}
                                        disabled={isExporting}
                                        className="btn-cancel h-8 gap-1.5 rounded-lg text-[11px] font-bold"
                                    >
                                        <Download size={12} /> {isExporting ? 'Exporting...' : 'Export CSV'}
                                    </Button>

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

                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Date</span>
                                    {DATE_FILTERS.map((item) => {
                                        const count = item.value === 'today'
                                            ? periodStats.todaySignals
                                            : item.value === 'tomorrow'
                                                ? periodStats.tomorrowSignals
                                            : item.value === 'week'
                                                ? periodStats.weeklySignals
                                                : item.value === 'month'
                                                    ? periodStats.monthlySignals
                                                    : stats.totalSignals;

                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => {
                                                    setFromDate('');
                                                    setToDate('');
                                                    setPagination((prev) => ({ ...prev, page: 1 }));
                                                    setDatePreset(item.value);
                                                }}
                                                className={clsx(
                                                    'rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all',
                                                    datePreset === item.value
                                                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]'
                                                        : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                                                )}
                                            >
                                                {item.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Custom Range</span>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(event) => {
                                            setDatePreset('custom');
                                            setPagination((prev) => ({ ...prev, page: 1 }));
                                            setFromDate(event.target.value);
                                        }}
                                        className="h-8 rounded-lg border border-border bg-secondary/30 px-2 text-[11px] font-mono text-foreground focus:border-primary/50 focus:bg-secondary/50 focus:outline-none"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">To</span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(event) => {
                                            setDatePreset('custom');
                                            setPagination((prev) => ({ ...prev, page: 1 }));
                                            setToDate(event.target.value);
                                        }}
                                        className="h-8 rounded-lg border border-border bg-secondary/30 px-2 text-[11px] font-mono text-foreground focus:border-primary/50 focus:bg-secondary/50 focus:outline-none"
                                    />
                                    {(fromDate || toDate) ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDatePreset('all');
                                                setFromDate('');
                                                setToDate('');
                                                setPagination((prev) => ({ ...prev, page: 1 }));
                                            }}
                                            className="rounded-md border border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-all hover:bg-muted/20 hover:text-foreground"
                                        >
                                            Clear
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        <TrendingUp size={12} />
                                        Net Points
                                    </div>
                                    <div className={`mt-2 text-lg font-black ${reportSummary.netPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {hasReportSummary ? reportSummary.netPoints : '--'}
                                    </div>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        {hasReportSummary ? `Avg ${reportSummary.averagePoints} points per settled signal` : 'Backend report not available on this environment'}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        Gross Breakdown
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-bold text-emerald-400">
                                            {hasReportSummary ? `+${reportSummary.grossProfitPoints}` : '--'}
                                        </span>
                                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 font-bold text-red-400">
                                            {hasReportSummary ? reportSummary.grossLossPoints : '--'}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-[11px] text-muted-foreground">
                                        {hasReportSummary ? `Win rate ${reportSummary.winRate}% from settled outcomes` : 'Waiting for backend report summary'}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        Current Range
                                    </div>
                                    <div className={`mt-2 text-lg font-black ${reportSummary.netPoints >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                                        {hasReportSummary ? reportSummary.netPoints : '--'}
                                    </div>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        {hasReportSummary ? 'Estimated points for selected date filter' : 'Deploy backend update to get range points'}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-secondary/20 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        Report Quality
                                    </div>
                                    <div className="mt-2 text-lg font-black text-foreground">
                                        {hasReportSummary ? reportSummary.closedSignals : '--'}
                                    </div>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        {hasReportSummary
                                            ? `Closed signals, ${reportSummary.lotSizeMissing} lot-size fallback${accuracyPercent !== null ? `, est. ${accuracyPercent}% confidence` : ''}`
                                            : 'No backend report summary received'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex min-h-0 flex-1 flex-col">
                            <div className="relative min-h-[680px] flex-1 xl:min-h-[760px]">
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
                                perPageOptions={[20, 50, 100]}
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

            <SignalDetailsDrawer
                isOpen={Boolean(selectedSignal)}
                signal={selectedSignal}
                detailSignal={signalDetail}
                history={detailRows}
                stats={detailStats}
                reportSummary={detailReportSummary}
                pagination={detailPagination}
                isLoading={isDetailLoading}
                error={detailError}
                onClose={closeSignalDetails}
                onOpenReport={handleOpenReportFromDetail}
                onSelectSignal={openSignalDetails}
            />
        </div>
    );
};

export default AllSignals;
