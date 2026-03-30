import React from 'react';
import {
    Activity,
    AlertTriangle,
    BadgeCheck,
    Clock3,
    Hash,
    Radio,
    Target,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

export const EMPTY_REPORT_SUMMARY = {
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

export const EMPTY_DETAIL_STATS = {
    totalSignals: 0,
    activeSignals: 0,
    closedSignals: 0,
    targetHit: 0,
    stoplossHit: 0,
    successRate: 0,
    partialProfit: 0,
};

export const EMPTY_DETAIL_PAGINATION = { page: 1, limit: 100, totalPages: 1, totalResults: 0 };

const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '---';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    return numeric.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

const formatPoints = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '---';
    const rounded = Math.round(numeric * 100) / 100;
    if (rounded > 0) return `+${rounded}`;
    return `${rounded}`;
};

const formatDateTime = (value) => {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';
    return date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getPointTone = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'text-foreground';
    if (numeric > 0) return 'text-emerald-400';
    if (numeric < 0) return 'text-red-400';
    return 'text-amber-300';
};

const getStatusTone = (status) => {
    switch (status) {
        case 'Active':
            return 'border-primary/30 bg-primary/10 text-primary';
        case 'Target Hit':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
        case 'Partial Profit Book':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
        case 'Stoploss Hit':
            return 'border-red-500/30 bg-red-500/10 text-red-300';
        case 'Closed':
            return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-200';
        default:
            return 'border-border/70 bg-muted/10 text-muted-foreground';
    }
};

const getStatusIcon = (status) => {
    if (status === 'Active') return <Radio size={10} className="animate-pulse" />;
    if (status === 'Stoploss Hit') return <AlertTriangle size={10} />;
    return <BadgeCheck size={10} />;
};

const StatCard = ({ label, value, tone = 'text-foreground', hint }) => (
    <div className="rounded-xl border border-border/70 bg-secondary/20 p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className={clsx('mt-2 text-lg font-black', tone)}>{value}</div>
        {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
);

const DetailRow = ({ label, value, valueClassName = 'text-foreground' }) => (
    <div className="rounded-lg border border-border/60 bg-muted/[0.06] px-3 py-2">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className={clsx('mt-1 text-sm font-bold', valueClassName)}>{value}</div>
    </div>
);

const SignalReportView = ({
    signal,
    detailSignal,
    history = [],
    stats,
    reportSummary,
    pagination,
    isLoading,
    error,
    onSelectSignal,
    badgeLabel = 'Signal Report',
    description = 'Full history and performance summary for the selected signal.',
    actions = null,
    className = '',
}) => {
    if (!signal) return null;

    const activeSignal = detailSignal || signal;
    const targets = activeSignal.targets || {};
    const visibleHistoryCount = Array.isArray(history) ? history.length : 0;
    const totalHistoryCount = Number(pagination?.totalResults || visibleHistoryCount || 0);
    const resolvedStats = stats || {};
    const resolvedSummary = reportSummary || {};
    const currentSignalId = activeSignal.id || activeSignal._id || signal.id || signal._id;
    const totalSignals = Number(
        resolvedSummary.totalSignals ||
        resolvedStats.totalSignals ||
        totalHistoryCount ||
        (activeSignal ? 1 : 0)
    );
    const activeSignals = Number(resolvedStats.activeSignals || resolvedSummary.activeSignals || 0);
    const closedSignals = Number(resolvedSummary.closedSignals || resolvedStats.closedSignals || 0);
    const targetHit = Number(resolvedSummary.targetHit || resolvedStats.targetHit || 0);
    const partialProfit = Number(resolvedSummary.partialProfit || resolvedStats.partialProfit || 0);
    const stoplossHit = Number(resolvedSummary.stoplossHit || resolvedStats.stoplossHit || 0);

    return (
        <div className={clsx('relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_24px_80px_-30px_rgba(0,0,0,0.55)]', className)}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%)]" />

            <div className="relative border-b border-border/70 bg-secondary/20 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                                {badgeLabel}
                            </span>
                            <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]', getStatusTone(activeSignal.status))}>
                                {getStatusIcon(activeSignal.status)}
                                {activeSignal.status || 'Unknown'}
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-black tracking-tight text-foreground">
                                {activeSignal.symbolName || activeSignal.symbol || 'Signal'}
                            </h2>
                            <span
                                className={clsx(
                                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]',
                                    activeSignal.type === 'BUY'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                                )}
                            >
                                {activeSignal.type === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {activeSignal.type || '---'}
                            </span>
                            <span className="rounded-full border border-border/70 bg-muted/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                {activeSignal.segment || '---'} {activeSignal.timeframe ? `| ${activeSignal.timeframe}` : ''}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                    </div>

                    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
                </div>
            </div>

            <div className="custom-scrollbar relative overflow-y-auto px-5 py-5">
                {error ? (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
                    <StatCard
                        label="Total Signals"
                        value={totalSignals || '0'}
                        hint={totalHistoryCount > visibleHistoryCount ? `Showing latest ${visibleHistoryCount}` : 'Same symbol and timeframe'}
                    />
                    <StatCard
                        label="Active"
                        value={activeSignals}
                        tone="text-primary"
                        hint={`${closedSignals} settled`}
                    />
                    <StatCard
                        label="Closed"
                        value={closedSignals}
                        tone="text-foreground"
                        hint={`${targetHit + partialProfit + stoplossHit} measured outcomes`}
                    />
                    <StatCard
                        label="Target Hit"
                        value={targetHit}
                        tone="text-emerald-400"
                        hint="Direct target exits"
                    />
                    <StatCard
                        label="Partial"
                        value={partialProfit}
                        tone="text-amber-300"
                        hint="Partial profit booked"
                    />
                    <StatCard
                        label="Stoploss"
                        value={stoplossHit}
                        tone="text-red-300"
                        hint="SL or forced adverse exits"
                    />
                    <StatCard
                        label="Net Points"
                        value={Number.isFinite(Number(resolvedSummary.netPoints)) ? formatPoints(resolvedSummary.netPoints) : '---'}
                        tone={getPointTone(resolvedSummary.netPoints)}
                        hint={`Avg ${Number.isFinite(Number(resolvedSummary.averagePoints)) ? formatPoints(resolvedSummary.averagePoints) : '---'}`}
                    />
                    <StatCard
                        label="Win Rate"
                        value={`${Number(resolvedSummary.winRate || resolvedStats.successRate || 0)}%`}
                        tone="text-emerald-400"
                        hint={`Positive ${Number(resolvedSummary.positiveSignals || 0)} | Negative ${Number(resolvedSummary.negativeSignals || 0)}`}
                    />
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                    <section className="rounded-2xl border border-border/70 bg-secondary/15 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                            <Activity size={12} />
                            Selected Signal
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <DetailRow label="Entry" value={formatPrice(activeSignal.entry)} />
                            <DetailRow label={activeSignal.status === 'Active' ? 'Current Points' : 'Final Points'} value={formatPoints(activeSignal.totalPoints)} valueClassName={getPointTone(activeSignal.totalPoints)} />
                            <DetailRow label="Stop Loss" value={formatPrice(activeSignal.stoploss)} valueClassName="text-red-400" />
                            <DetailRow label={activeSignal.status === 'Active' ? 'Live / Exit' : 'Exit'} value={formatPrice(activeSignal.exitPrice)} />
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-3">
                            <DetailRow label="TP1" value={formatPrice(targets.target1)} valueClassName="text-emerald-400" />
                            <DetailRow label="TP2" value={formatPrice(targets.target2)} valueClassName="text-emerald-400" />
                            <DetailRow label="TP3" value={formatPrice(targets.target3)} valueClassName="text-emerald-400" />
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                            <DetailRow label="Signal Time" value={formatDateTime(activeSignal.displaySignalTime || activeSignal.signalTime || activeSignal.createdAt)} />
                            <DetailRow label="Exit Time" value={formatDateTime(activeSignal.displayExitTime || activeSignal.exitTime)} />
                            <DetailRow label="Created At" value={formatDateTime(activeSignal.createdAt)} />
                            <DetailRow label="Updated At" value={formatDateTime(activeSignal.updatedAt)} />
                        </div>

                        <div className="mt-4 grid gap-2">
                            <DetailRow label="UID" value={activeSignal.uniqueId || '---'} />
                            <DetailRow label="Webhook Id" value={activeSignal.webhookId || '---'} />
                            {activeSignal.exitReason ? <DetailRow label="Exit Reason" value={activeSignal.exitReason} /> : null}
                            {activeSignal.notes ? <DetailRow label="Notes" value={activeSignal.notes} valueClassName="text-sm font-medium text-muted-foreground" /> : null}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-secondary/15 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                            <Hash size={12} />
                            Summary Snapshot
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Positive Signals</span>
                                <span className="text-sm font-black text-emerald-400">{Number(resolvedSummary.positiveSignals || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Negative Signals</span>
                                <span className="text-sm font-black text-red-300">{Number(resolvedSummary.negativeSignals || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Neutral Signals</span>
                                <span className="text-sm font-black text-foreground">{Number(resolvedSummary.neutralSignals || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Gross Profit</span>
                                <span className="text-sm font-black text-emerald-400">{formatPoints(resolvedSummary.grossProfitPoints)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Gross Loss</span>
                                <span className="text-sm font-black text-red-300">{formatPoints(resolvedSummary.grossLossPoints)}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-2.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Closed Without Points</span>
                                <span className="text-sm font-black text-foreground">{Number(resolvedSummary.closedWithoutPoints || 0)}</span>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-border/60 bg-muted/[0.06] px-3 py-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                                <Clock3 size={12} />
                                Quick Read
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {totalSignals || 0} signals have been recorded for {activeSignal.symbol || 'this script'}
                                {activeSignal.timeframe ? ` (${activeSignal.timeframe})` : ''}. Target hits: {targetHit}, partial exits: {partialProfit}, stoploss exits: {stoplossHit}. Net outcome{' '}
                                <span className={clsx('font-bold', getPointTone(resolvedSummary.netPoints))}>
                                    {Number.isFinite(Number(resolvedSummary.netPoints)) ? formatPoints(resolvedSummary.netPoints) : '---'}
                                </span>{' '}
                                points.
                            </p>
                        </div>
                    </section>
                </div>

                <section className="mt-5 rounded-2xl border border-border/70 bg-secondary/15 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                                <Target size={12} />
                                Signal Timeline
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Click any row to open the full report for that exact signal instance.
                            </p>
                        </div>

                        {isLoading ? (
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                Loading...
                            </span>
                        ) : (
                            <span className="rounded-full border border-border/70 bg-muted/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                {visibleHistoryCount} shown
                            </span>
                        )}
                    </div>

                    <div className="mt-4 space-y-2">
                        {history.length === 0 && !isLoading ? (
                            <div className="rounded-xl border border-border/60 bg-muted/[0.06] px-4 py-6 text-center text-sm text-muted-foreground">
                                No additional history is currently available for this symbol/timeframe.
                            </div>
                        ) : null}

                        {history.map((item) => {
                            const itemId = item.id || item._id;
                            const isCurrent = String(itemId) === String(currentSignalId);
                            const itemSignalTime = item.displaySignalTime || item.signalTime || item.createdAt;
                            const itemExitTime = item.displayExitTime || item.exitTime;
                            return (
                                <button
                                    key={itemId}
                                    type="button"
                                    onClick={() => onSelectSignal?.(item)}
                                    className={clsx(
                                        'w-full rounded-xl border px-3 py-3 text-left transition-all',
                                        isCurrent
                                            ? 'border-primary/40 bg-primary/10 shadow-[0_0_24px_rgba(59,130,246,0.14)]'
                                            : 'border-border/60 bg-muted/[0.04] hover:border-border hover:bg-muted/[0.08]'
                                    )}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-sans text-sm font-black text-foreground">
                                                    {item.symbolName || item.symbol || '---'}
                                                </span>
                                                <span
                                                    className={clsx(
                                                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em]',
                                                        item.type === 'BUY'
                                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                            : 'border-red-500/30 bg-red-500/10 text-red-400'
                                                    )}
                                                >
                                                    {item.type === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                    {item.type}
                                                </span>
                                                <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em]', getStatusTone(item.status))}>
                                                    {getStatusIcon(item.status)}
                                                    {item.status}
                                                </span>
                                                {isCurrent ? (
                                                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                                                        Selected
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                                                <span>Signal: <span className="font-semibold text-foreground">{formatDateTime(itemSignalTime)}</span></span>
                                                <span>Exit: <span className="font-semibold text-foreground">{formatDateTime(itemExitTime)}</span></span>
                                            </div>
                                        </div>

                                        <div className="grid shrink-0 grid-cols-3 gap-2 text-right">
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Entry</div>
                                                <div className="mt-1 text-sm font-bold text-foreground">{formatPrice(item.entry)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Exit</div>
                                                <div className="mt-1 text-sm font-bold text-foreground">{formatPrice(item.exitPrice)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Points</div>
                                                <div className={clsx('mt-1 text-sm font-black', getPointTone(item.totalPoints))}>
                                                    {formatPoints(item.totalPoints)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SignalReportView;
