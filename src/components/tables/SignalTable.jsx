import React, { useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    ArrowUpRight,
    BadgeCheck,
    Clock,
    Edit,
    MoreVertical,
    Radio,
    ShieldAlert,
    Target,
    Trash2,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { socket } from '../../api/socket';
import TableHeaderCell from '../ui/TableHeaderCell';

const CLOSED_STATUSES = new Set(['Closed', 'Target Hit', 'Partial Profit Book', 'Stoploss Hit']);

const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '---';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    return numeric.toFixed(2);
};

const formatDateTime = (value) => {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';
    return date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getTimeAgo = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};

const getStatusClasses = (status) => {
    switch (status) {
        case 'Active':
            return 'border-primary/30 text-primary bg-primary/10';
        case 'Target Hit':
            return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10';
        case 'Partial Profit Book':
            return 'border-amber-500/30 text-amber-500 bg-amber-500/10';
        case 'Stoploss Hit':
            return 'border-red-500/30 text-red-500 bg-red-500/10';
        case 'Closed':
            return 'border-amber-500/30 text-amber-500 bg-amber-500/10';
        default:
            return 'border-border/70 text-muted-foreground bg-muted/10';
    }
};

const toFiniteNumber = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
};

const resolveExitPrice = (signal, livePrice) => {
    const status = String(signal?.status || '').trim().toLowerCase();
    const exit = toFiniteNumber(signal?.exitPrice);
    if (typeof exit === 'number') return exit;

    if (status.includes('stop')) {
        const sl = toFiniteNumber(signal?.stoploss);
        if (typeof sl === 'number') return sl;
    }

    if (status.includes('target')) {
        const t1 = toFiniteNumber(signal?.targets?.target1);
        if (typeof t1 === 'number') return t1;
    }

    if (status.includes('partial')) {
        const t2 = toFiniteNumber(signal?.targets?.target2);
        const t1 = toFiniteNumber(signal?.targets?.target1);
        if (typeof t2 === 'number') return t2;
        if (typeof t1 === 'number') return t1;
    }

    return typeof livePrice === 'number' ? livePrice : undefined;
};

const resolvePoints = (signal, livePrice) => {
    const stored = toFiniteNumber(signal?.totalPoints);
    if (typeof stored === 'number' && stored !== 0) return stored;

    const entry = toFiniteNumber(signal?.entry);
    const exit = resolveExitPrice(signal, livePrice);
    if (typeof entry !== 'number' || typeof exit !== 'number') return undefined;

    const isSell = String(signal?.type || '').toUpperCase() === 'SELL';
    const points = isSell ? entry - exit : exit - entry;
    return Math.round(points * 100) / 100;
};

const isTargetHit = (targetValue, price, isBuy) => {
    const target = toFiniteNumber(targetValue);
    if (typeof target !== 'number' || typeof price !== 'number') return false;
    return isBuy ? price >= target : price <= target;
};

const SignalTable = ({ signals, onAction, onRowClick, isLoading, highlightTerm }) => {
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [ltpData, setLtpData] = useState({});
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!signals || signals.length === 0) return undefined;

        const symbols = [...new Set(signals.map((signal) => signal.symbol).filter(Boolean))];
        symbols.forEach((symbol) => socket.emit('subscribe', symbol));

        const onTick = (tick) => {
            if (!tick?.symbol || !symbols.includes(tick.symbol)) return;

            setLtpData((prev) => ({
                ...prev,
                [tick.symbol]: {
                    price: tick.price ?? tick.last_price,
                    change: tick.change ?? 0,
                },
            }));
        };

        socket.on('tick', onTick);

        return () => {
            socket.off('tick', onTick);
            symbols.forEach((symbol) => socket.emit('unsubscribe', symbol));
        };
    }, [signals]);

    const toggleDropdown = (signalId, event) => {
        event.stopPropagation();
        setOpenDropdownId((current) => (current === signalId ? null : signalId));
    };

    return (
        <div className="terminal-panel relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
            <div className="absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="custom-scrollbar flex-1 overflow-auto pb-20">
                <table className="w-full whitespace-nowrap text-left">
                    <thead className="sticky top-0 z-20 border-b border-border bg-muted/50 text-[9px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="w-[320px] border-r border-border bg-muted/90 px-4 py-3 backdrop-blur-sm" icon={Radio} label="Signal / Routing" />
                            <TableHeaderCell className="w-24 border-r border-border bg-muted/90 px-4 py-3 text-center backdrop-blur-sm" icon={TrendingUp} label="Type" align="center" />
                            <TableHeaderCell className="w-28 border-r border-border bg-muted/90 px-4 py-3 text-right backdrop-blur-sm" icon={ArrowUpRight} label="Entry" align="right" />
                            <TableHeaderCell className="w-[240px] border-r border-border bg-muted/90 px-4 py-3 backdrop-blur-sm" icon={Target} label="Targets" />
                            <TableHeaderCell className="w-[220px] border-r border-border bg-muted/90 px-4 py-3 backdrop-blur-sm" icon={ShieldAlert} label="Risk / Outcome" />
                            <TableHeaderCell className="w-[220px] border-r border-border bg-muted/90 px-4 py-3 backdrop-blur-sm" icon={Clock} label="Timing" />
                            <TableHeaderCell className="w-32 border-r border-border bg-muted/90 px-4 py-3 text-center backdrop-blur-sm" icon={BadgeCheck} label="Status" align="center" />
                            <TableHeaderCell className="w-14 bg-muted/90 px-4 py-3 text-center backdrop-blur-sm" icon={MoreVertical} label="Action" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent font-mono text-[11px] font-medium">
                        {isLoading ? (
                            [...Array(8)].map((_, index) => (
                                <tr key={`signal-skeleton-${index}`} className="animate-pulse">
                                    <td className="border-r border-border px-4 py-4">
                                        <div className="mb-2 h-4 w-36 rounded bg-muted/50" />
                                        <div className="mb-2 h-3 w-48 rounded bg-muted/50" />
                                        <div className="h-3 w-56 rounded bg-muted/50" />
                                    </td>
                                    <td className="border-r border-border px-4 py-4 text-center"><div className="mx-auto h-6 w-16 rounded bg-muted/50" /></td>
                                    <td className="border-r border-border px-4 py-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted/50" /></td>
                                    <td className="border-r border-border px-4 py-4"><div className="h-4 w-40 rounded bg-muted/50" /></td>
                                    <td className="border-r border-border px-4 py-4"><div className="h-4 w-36 rounded bg-muted/50" /></td>
                                    <td className="border-r border-border px-4 py-4"><div className="h-4 w-40 rounded bg-muted/50" /></td>
                                    <td className="border-r border-border px-4 py-4 text-center"><div className="mx-auto h-5 w-20 rounded bg-muted/50" /></td>
                                    <td className="px-4 py-4 text-center"><div className="mx-auto h-6 w-6 rounded bg-muted/50" /></td>
                                </tr>
                            ))
                        ) : (
                            signals.map((signal, index) => {
                                const signalId = signal.id || signal._id || `${signal.symbol}-${index}`;
                                const isBuy = signal.type === 'BUY';
                                const isClosed = CLOSED_STATUSES.has(signal.status);
                                const targets = signal.targets || {};
                                const livePrice = ltpData[signal.symbol]?.price;
                                const resolvedExit = resolveExitPrice(signal, livePrice);
                                const resolvedPoints = resolvePoints(signal, livePrice);
                                const priceForTargets = typeof livePrice === 'number' ? livePrice : resolvedExit;
                                const signalTime = signal.signalTime || signal.createdAt || signal.timestamp;
                                const highlightMatch =
                                    highlightTerm &&
                                    `${signal.symbol} ${signal.uniqueId || ''} ${signal.webhookId || ''}`
                                        .toLowerCase()
                                        .includes(highlightTerm.toLowerCase());

                                return (
                                    <tr
                                        key={signalId}
                                        onClick={() => onRowClick?.(signal)}
                                        className={clsx(
                                            'group relative cursor-pointer transition-all duration-200 hover:bg-primary/[0.03]',
                                            highlightMatch && 'bg-primary/5 shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)]'
                                        )}
                                    >
                                        <td className="border-r border-border px-4 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-sans text-sm font-extrabold tracking-tight text-foreground">{signal.symbol || '---'}</span>
                                                            <span className={clsx(
                                                                'rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.22em]',
                                                                signal.isFree ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' : 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                                                            )}>
                                                                {signal.isFree ? 'Free' : 'Premium'}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                            {[signal.segment, signal.category, signal.timeframe].filter(Boolean).map((item) => (
                                                                <span key={`${signalId}-${item}`} className="rounded-md border border-border/70 bg-muted/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid gap-1 text-[9px] text-muted-foreground">
                                                    <div className="truncate">
                                                        <span className="font-semibold text-foreground/80">UID:</span>{' '}
                                                        <span title={signal.uniqueId || '---'}>{signal.uniqueId || '---'}</span>
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="font-semibold text-foreground/80">Webhook:</span>{' '}
                                                        <span title={signal.webhookId || '---'}>{signal.webhookId || '---'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="border-r border-border px-4 py-4 text-center">
                                            <div className={clsx(
                                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                isBuy
                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                    : 'border-red-500/20 bg-red-500/10 text-red-400'
                                            )}>
                                                {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {signal.type || '---'}
                                            </div>
                                        </td>

                                        <td className="border-r border-border px-4 py-4 text-right text-foreground">
                                            <div className="text-xs font-extrabold">{formatPrice(signal.entry)}</div>
                                            <div className="mt-1 text-[9px] text-muted-foreground">
                                                Live: <span className="font-semibold text-foreground/80">{formatPrice(livePrice)}</span>
                                            </div>
                                        </td>

                                        <td className="border-r border-border px-4 py-4">
                                            <div className="grid gap-1">
                                                {[
                                                    ['TP1', targets.target1],
                                                    ['TP2', targets.target2],
                                                    ['TP3', targets.target3],
                                                ].map(([label, value]) => {
                                                    const hit = isTargetHit(value, priceForTargets, isBuy);
                                                    return (
                                                        <div
                                                            key={`${signalId}-${label}`}
                                                            className={clsx(
                                                                "flex items-center justify-between gap-3 rounded-lg border px-2.5 py-1.5",
                                                                hit
                                                                    ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                                                                    : "border-border/60 bg-muted/[0.06]"
                                                            )}
                                                        >
                                                            <span className={clsx(
                                                                "text-[9px] font-black uppercase tracking-wide",
                                                                hit ? "text-emerald-400" : "text-muted-foreground"
                                                            )}>
                                                                {label}
                                                            </span>
                                                            <span className={clsx(
                                                                "text-[10px] font-bold",
                                                                hit ? "text-emerald-300" : "text-emerald-400"
                                                            )}>
                                                                {formatPrice(value)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        <td className="border-r border-border px-4 py-4">
                                            <div className="grid gap-1.5">
                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/[0.06] px-2.5 py-1.5">
                                                    <span className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">SL</span>
                                                    <span className="text-[10px] font-bold text-red-400">{formatPrice(signal.stoploss)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/[0.06] px-2.5 py-1.5">
                                                    <span className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                                                        {isClosed ? 'Exit' : 'LTP'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-foreground">
                                                        {formatPrice(isClosed ? resolvedExit : livePrice)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/[0.06] px-2.5 py-1.5">
                                                    <span className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Points</span>
                                                    <span className="text-[10px] font-bold text-foreground">
                                                        {resolvedPoints ?? '---'}
                                                    </span>
                                                </div>
                                                {signal.exitReason ? (
                                                    <div className="truncate text-[9px] text-muted-foreground" title={signal.exitReason}>
                                                        Reason: <span className="font-semibold text-foreground/80">{signal.exitReason}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>

                                        <td className="border-r border-border px-4 py-4">
                                            <div className="grid gap-2">
                                                <div>
                                                    <div className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Signal Time</div>
                                                    <div className="mt-1 text-[10px] font-semibold text-foreground">{formatDateTime(signalTime)}</div>
                                                    <div className="text-[9px] text-muted-foreground">{getTimeAgo(signalTime)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Exit Time</div>
                                                    <div className="mt-1 text-[10px] font-semibold text-foreground">{formatDateTime(signal.exitTime)}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="border-r border-border px-4 py-4 text-center">
                                            <span className={clsx(
                                                'mx-auto inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em]',
                                                getStatusClasses(signal.status)
                                            )}>
                                                {signal.status === 'Active' ? <Radio size={8} className="animate-pulse" /> : <BadgeCheck size={8} />}
                                                {signal.status || 'Unknown'}
                                            </span>
                                        </td>

                                        <td className="relative px-4 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={(event) => toggleDropdown(signalId, event)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-muted/20 hover:text-foreground"
                                            >
                                                <MoreVertical size={14} />
                                            </button>

                                            {openDropdownId === signalId && (
                                                <div ref={dropdownRef} className="absolute right-8 top-2 z-50 flex w-44 flex-col overflow-hidden rounded-lg border border-border bg-card py-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onAction?.('edit', signal);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold hover:bg-muted/20"
                                                    >
                                                        <Edit size={14} /> Edit Signal
                                                    </button>

                                                    {!isClosed ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onAction?.('updateStatus', signal, 'Target Hit');
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="flex items-center gap-2.5 border-t border-border/10 px-3 py-2 text-left text-[10px] font-bold hover:bg-emerald-500/10 hover:text-emerald-500"
                                                            >
                                                                <Target size={14} /> Target Hit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onAction?.('updateStatus', signal, 'Partial Profit Book');
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="flex items-center gap-2.5 border-t border-border/10 px-3 py-2 text-left text-[10px] font-bold hover:bg-amber-500/10 hover:text-amber-500"
                                                            >
                                                                <BadgeCheck size={14} /> Partial Profit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onAction?.('updateStatus', signal, 'Stoploss Hit');
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="flex items-center gap-2.5 border-t border-border/10 px-3 py-2 text-left text-[10px] font-bold hover:bg-red-500/10 hover:text-red-500"
                                                            >
                                                                <AlertTriangle size={14} /> Stoploss Hit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onAction?.('close', signal);
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="flex items-center gap-2.5 border-t border-border/10 px-3 py-2 text-left text-[10px] font-bold hover:bg-muted/20"
                                                            >
                                                                <XCircle size={14} /> Force Close
                                                            </button>
                                                        </>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onAction?.('delete', signal);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="flex items-center gap-2.5 border-t border-border/10 px-3 py-2 text-left text-[10px] font-black text-red-500 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={14} /> Purge Record
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SignalTable;
