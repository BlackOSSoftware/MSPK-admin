import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import { fetchSignal, fetchSignals } from '../../api/signals.api';
import SignalReportView, {
    EMPTY_DETAIL_PAGINATION,
    EMPTY_DETAIL_STATS,
    EMPTY_REPORT_SUMMARY,
} from './SignalReportView';

const SignalReport = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const requestRef = useRef(0);
    const returnToRef = useRef(location.state?.from || '/signals/all');

    const signalId = String(searchParams.get('id') || '').trim();
    const returnTo = returnToRef.current;

    const [selectedSignal, setSelectedSignal] = useState(null);
    const [detailSignal, setDetailSignal] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [detailStats, setDetailStats] = useState(EMPTY_DETAIL_STATS);
    const [detailReportSummary, setDetailReportSummary] = useState(EMPTY_REPORT_SUMMARY);
    const [detailPagination, setDetailPagination] = useState(EMPTY_DETAIL_PAGINATION);
    const [detailError, setDetailError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const resetDetailState = useCallback(() => {
        setSelectedSignal(null);
        setDetailSignal(null);
        setHistoryRows([]);
        setDetailStats(EMPTY_DETAIL_STATS);
        setDetailReportSummary(EMPTY_REPORT_SUMMARY);
        setDetailPagination(EMPTY_DETAIL_PAGINATION);
        setDetailError('');
        setIsLoading(false);
    }, []);

    const loadSignalDetails = useCallback(async (nextSignalId, fallbackSignal = null) => {
        if (!nextSignalId) {
            resetDetailState();
            return;
        }

        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setIsLoading(true);
        setDetailError('');
        if (fallbackSignal) {
            setSelectedSignal(fallbackSignal);
            setDetailSignal(fallbackSignal);
        }

        try {
            const detailResponse = await fetchSignal(nextSignalId);
            if (requestRef.current !== requestId) return;

            const resolvedSignal = detailResponse?.data || fallbackSignal;
            if (!resolvedSignal) {
                throw new Error('Signal detail not found');
            }

            setSelectedSignal(resolvedSignal);
            setDetailSignal(resolvedSignal);

            const historyResponse = await fetchSignals({
                symbol: resolvedSignal.sourceSymbol || resolvedSignal.symbol,
                timeframe: resolvedSignal.timeframe,
                includeReport: 1,
                page: 1,
                limit: 200,
                sortBy: 'latest-event',
            });

            if (requestRef.current !== requestId) return;

            setHistoryRows(Array.isArray(historyResponse?.data?.results) ? historyResponse.data.results : []);
            setDetailStats(historyResponse?.data?.stats || EMPTY_DETAIL_STATS);
            setDetailReportSummary(historyResponse?.data?.report?.summary || EMPTY_REPORT_SUMMARY);
            setDetailPagination(historyResponse?.data?.pagination || EMPTY_DETAIL_PAGINATION);
        } catch (error) {
            console.error('Failed to load signal report', error);
            if (requestRef.current !== requestId) return;

            if (fallbackSignal) {
                setSelectedSignal(fallbackSignal);
                setDetailSignal(fallbackSignal);
            }

            setDetailError('Signal report load nahi ho paya. Thodi der baad retry karo.');
        } finally {
            if (requestRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [resetDetailState]);

    useEffect(() => {
        loadSignalDetails(signalId);
    }, [loadSignalDetails, signalId]);

    const handleHistorySelect = useCallback((signal) => {
        const nextId = signal?.id || signal?._id;
        if (!nextId) return;
        setSearchParams({ id: String(nextId) });
        loadSignalDetails(nextId, signal);
    }, [loadSignalDetails, setSearchParams]);

    const handleRefresh = useCallback(async () => {
        if (!signalId) return;
        await loadSignalDetails(signalId, detailSignal || selectedSignal);
        toast.success('Signal report refreshed');
    }, [detailSignal, loadSignalDetails, selectedSignal, signalId, toast]);

    return (
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 p-3 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">Signals</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Signal Performance Report</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Signal click par ab direct full report milegi, market watchlist page nahi.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="btn-cancel gap-2"
                        onClick={() => navigate(returnTo)}
                    >
                        <ArrowLeft size={16} />
                        Back To Signals
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={handleRefresh}
                        disabled={!signalId || isLoading}
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            </div>

            {!signalId ? (
                <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-[0_18px_60px_-28px_rgba(0,0,0,0.45)]">
                    <div className="text-lg font-black text-foreground">No signal selected</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Signal list se kisi signal par click karke full report khol sakte ho.
                    </p>
                </div>
            ) : !selectedSignal && isLoading ? (
                <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-[0_18px_60px_-28px_rgba(0,0,0,0.45)]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
                        {[...Array(8)].map((_, index) => (
                            <div key={`report-skeleton-${index}`} className="h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/10" />
                        ))}
                    </div>
                    <div className="mt-5 h-[420px] animate-pulse rounded-3xl border border-border/60 bg-muted/10" />
                </div>
            ) : !selectedSignal ? (
                <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-[0_18px_60px_-28px_rgba(0,0,0,0.45)]">
                    <div className="text-lg font-black text-red-200">Signal report unavailable</div>
                    <p className="mt-2 text-sm text-red-100/80">
                        Requested signal load nahi ho paya. Signal list se dobara open karke try karo.
                    </p>
                </div>
            ) : (
                <SignalReportView
                    signal={selectedSignal}
                    detailSignal={detailSignal}
                    history={historyRows}
                    stats={detailStats}
                    reportSummary={detailReportSummary}
                    pagination={detailPagination}
                    isLoading={isLoading}
                    error={detailError}
                    onSelectSignal={handleHistorySelect}
                    badgeLabel="Detailed Report"
                    description="Kitne signals aaye, kitne target hit hue, kitna point gain ya loss hua aur poori timeline ek jagah."
                />
            )}
        </div>
    );
};

export default SignalReport;
