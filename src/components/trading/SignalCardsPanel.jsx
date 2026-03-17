import { getHistory } from '../../api/market.api';
import { fetchSignals as fetchBackendSignals } from '../../api/signals.api';
import { formatPrice } from '../../utils/chartUtils';
import { normalizeSignalTimeframe } from '../../utils/timeframe';
import { useState, useEffect } from 'react';

const TIMEFRAMES = [
    { key: '5m', label: '5 Min' },
    { key: '15m', label: '15 Min' },
    { key: '1h', label: '1 Hour' },
];

const getSignalEventTime = (signal) => signal?.exitTime || signal?.signalTime || signal?.createdAt || signal?.timestamp || null;

const isSignalClosed = (signal) => {
    if (!signal) return false;
    const status = String(signal.status || '').trim().toLowerCase();
    if (signal.exitTime) return true;
    return status.includes('target') || status.includes('partial') || status.includes('stop') || status.includes('close');
};

const shouldReplaceSignal = (nextSignal, existingSignal) => {
    if (!existingSignal) return true;

    const nextIsActive = !isSignalClosed(nextSignal);
    const existingIsActive = !isSignalClosed(existingSignal);

    if (nextIsActive !== existingIsActive) {
        return nextIsActive;
    }

    const nextTime = new Date(getSignalEventTime(nextSignal) || 0).getTime();
    const existingTime = new Date(getSignalEventTime(existingSignal) || 0).getTime();
    return nextTime >= existingTime;
};

const formatTimeAgo = (value) => {
    if (!value) return '—';
    const ts = new Date(value).getTime();
    if (Number.isNaN(ts)) return '—';
    const diffMs = Date.now() - ts;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
};

const getSignalTone = (type) => {
    if (type === 'BUY') {
        return {
            pill: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
            glow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
            accent: 'text-emerald-400',
            border: 'border-emerald-500/30',
        };
    }
    if (type === 'SELL') {
        return {
            pill: 'border-red-500/50 bg-red-500/10 text-red-400',
            glow: 'from-red-500/15 via-red-500/5 to-transparent',
            accent: 'text-red-400',
            border: 'border-red-500/30',
        };
    }
    return {
        pill: 'border-border/60 bg-muted/10 text-muted-foreground',
        glow: 'from-primary/10 via-primary/5 to-transparent',
        accent: 'text-muted-foreground',
        border: 'border-border/60',
    };
};

const SignalCard = ({ timeframe, signal }) => {
    const tone = getSignalTone(signal.type);
    const isNeutral = signal.type === 'NEUTRAL';

    return (
        <div className={`group relative overflow-hidden rounded-2xl border ${tone.border} bg-card/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}>
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-60`} />
            <div className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">Pro Signal</div>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${tone.pill}`}>
                    {timeframe}
                </span>
            </div>

            <div className="relative mt-3 flex items-center justify-between">
                <div>
                    <div className="text-lg font-black text-foreground">{signal.symbol || '—'}</div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{signal.statusLabel}</div>
                </div>
                <div className={`text-sm font-bold ${tone.accent}`}>{signal.type}</div>
            </div>

            <div className="relative mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Entry</div>
                    <div className="mt-1 font-bold text-foreground">{signal.entry || '—'}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">SL</div>
                    <div className="mt-1 font-bold text-foreground">{signal.sl || '—'}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">TP1</div>
                    <div className="mt-1 font-bold text-foreground">{signal.t1 || '—'}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">TP2</div>
                    <div className="mt-1 font-bold text-foreground">{signal.t2 || '—'}</div>
                </div>
            </div>

            <div className="relative mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">TP3</div>
                    <div className="mt-1 font-bold text-foreground">{signal.t3 || '—'}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">P/L</div>
                    <div className={`mt-1 font-bold ${signal.pnlTone}`}>{signal.pnl || '—'}</div>
                </div>
            </div>

            <div className="relative mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{isNeutral ? 'Standby mode' : signal.timeAgo}</span>
                <span className="rounded-full border border-border/60 bg-muted/10 px-2 py-0.5 uppercase tracking-[0.2em]">
                    {signal.sourceLabel}
                </span>
            </div>
        </div>
    );
};

const SignalCardsPanel = ({ symbol }) => {
    const [signals, setSignals] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;

        const fetchSignals = async () => {
            setLoading(true);
            const newSignals = {};

            try {
                const response = await fetchBackendSignals({
                    symbol: symbol.symbol,
                    sortBy: 'latest-event',
                    limit: 120,
                });

                const signalsData = response.data?.results || response.results || [];
                const sorted = [...signalsData].sort((a, b) => {
                    const tA = new Date(getSignalEventTime(a) || 0).getTime();
                    const tB = new Date(getSignalEventTime(b) || 0).getTime();
                    return tB - tA;
                });

                const latestByTf = {};
                TIMEFRAMES.forEach(tf => { latestByTf[tf.key] = null; });

                sorted.forEach((s) => {
                    const key = normalizeSignalTimeframe(s.timeframe);
                    if (key && shouldReplaceSignal(s, latestByTf[key])) {
                        latestByTf[key] = s;
                    }
                });

                TIMEFRAMES.forEach((tf) => {
                    const lastSignal = latestByTf[tf.key];
                    if (!lastSignal) {
                        newSignals[tf.key] = {
                            symbol: symbol.symbol,
                            type: 'NEUTRAL',
                            statusLabel: 'No signal',
                            timeAgo: '—',
                            sourceLabel: tf.label,
                        };
                        return;
                    }

                    const entry = lastSignal.entry || lastSignal.entryPrice;
                    const isBuy = lastSignal.type === 'BUY';
                    const sl = lastSignal.stoploss || lastSignal.stopLoss;
                    const t1 = lastSignal.targets?.target1;
                    const t2 = lastSignal.targets?.target2;
                    const t3 = lastSignal.targets?.target3;
                    const currentPrice = lastSignal.exitPrice || symbol.price || entry;
                    const pnl = typeof entry === 'number' && typeof currentPrice === 'number'
                        ? (isBuy ? (currentPrice - entry) : (entry - currentPrice))
                        : null;

                    newSignals[tf.key] = {
                        symbol: lastSignal.symbol || symbol.symbol,
                        type: lastSignal.type || 'NEUTRAL',
                        statusLabel: lastSignal.status || 'Active',
                        timeAgo: formatTimeAgo(getSignalEventTime(lastSignal)),
                        sourceLabel: tf.label,
                        entry: entry ? formatPrice(entry, symbol.symbol) : '—',
                        t1: t1 ? formatPrice(t1, symbol.symbol) : '—',
                        t2: t2 ? formatPrice(t2, symbol.symbol) : '—',
                        t3: t3 ? formatPrice(t3, symbol.symbol) : '—',
                        sl: sl ? formatPrice(sl, symbol.symbol) : '—',
                        pnl: pnl !== null ? formatPrice(pnl, symbol.symbol) : '—',
                        pnlTone: pnl === null ? 'text-muted-foreground' : pnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                    };
                });

                setSignals(newSignals);
            } catch (err) {
                console.error("Failed to fetch backend signals", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSignals();
        // Poll every 1 minute
        const interval = setInterval(fetchSignals, 60000);
        return () => clearInterval(interval);

    }, [symbol?.symbol]);

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="relative border-b border-border bg-card/60 px-4 py-3">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">Signals</p>
                        <p className="text-sm font-semibold text-foreground">Strategy Highlights</p>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                        {symbol?.symbol || '—'}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="grid gap-3">
                        {[...Array(3)].map((_, idx) => (
                            <div key={`signal-skeleton-${idx}`} className="h-44 rounded-2xl border border-border/60 bg-muted/10 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {TIMEFRAMES.map((tf) => (
                            <SignalCard
                                key={tf.key}
                                timeframe={tf.label}
                                signal={signals[tf.key] || {
                                    symbol: symbol?.symbol,
                                    type: 'NEUTRAL',
                                    statusLabel: 'No signal',
                                    timeAgo: '—',
                                    sourceLabel: tf.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalCardsPanel;
