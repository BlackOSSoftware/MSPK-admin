import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Clock, MoreVertical, XCircle, Trash2, Edit, Cpu, Activity, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { socket } from '../../api/socket';

const SignalTable = ({ signals, onAction, onRowClick, isLoading, highlightTerm }) => {
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const [ltpData, setLtpData] = useState({});

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
        if (!signals || signals.length === 0) return;
        const symbols = [...new Set(signals.map(s => s.symbol))];
        symbols.forEach(sym => socket.emit('subscribe', sym));

        const onTick = (data) => {
            if (symbols.includes(data.symbol)) {
                setLtpData(prev => ({
                    ...prev,
                    [data.symbol]: {
                        price: data.price,
                        change: data.change || 0,
                    }
                }));
            }
        };

        socket.on('tick', onTick);
        return () => {
            socket.off('tick', onTick);
            symbols.forEach(sym => socket.emit('unsubscribe', sym));
        };
    }, [signals]);

    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const formatTime = (date) => {
        if (!date) return '---';
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const getTimeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col font-sans">
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar pb-20">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-20 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <th className="px-4 py-3 border-r border-border bg-muted/90 backdrop-blur-sm w-44">Symbol / Strategy</th>
                            <th className="px-4 py-3 border-r border-border bg-muted/90 backdrop-blur-sm text-center w-20">Type</th>
                            <th className="px-4 py-3 border-r border-border bg-muted/90 backdrop-blur-sm text-right w-24">Entry</th>
                            <th className="px-4 py-3 border-r border-border bg-muted/90 backdrop-blur-sm text-right w-24">LTP</th>
                            <th className="px-4 py-3 border-r border-border bg-muted/90 backdrop-blur-sm w-56">Hybrid Metrics</th>
                            <th className="px-4 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm w-24">Target</th>
                            <th className="px-4 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm w-24">Stoploss</th>
                            <th className="px-4 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm w-24">Generated</th>
                            <th className="px-4 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm w-24">Status</th>
                            <th className="px-4 py-3 text-center bg-muted/90 backdrop-blur-sm w-10">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(8)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-4 py-3 border-r border-border"><div className="h-4 w-32 bg-muted/50 rounded mb-1"></div><div className="h-3 w-20 bg-muted/50 rounded"></div></td>
                                    <td className="px-4 py-3 border-r border-border"><div className="h-6 w-16 bg-muted/50 rounded mx-auto"></div></td>
                                    <td className="px-4 py-3 border-r border-border text-right"><div className="h-4 w-16 bg-muted/50 rounded ml-auto"></div></td>
                                    <td className="px-4 py-3 border-r border-border text-right"><div className="h-4 w-16 bg-muted/50 rounded ml-auto"></div></td>
                                    <td className="px-4 py-3 border-r border-border"><div className="h-4 w-44 bg-muted/50 rounded"></div></td>
                                    <td className="px-4 py-3 border-r border-border text-center"><div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div></td>
                                    <td className="px-4 py-3 border-r border-border text-center"><div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div></td>
                                    <td className="px-4 py-3 border-r border-border text-center"><div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div></td>
                                    <td className="px-4 py-3 border-r border-border text-center"><div className="h-5 w-16 bg-muted/50 rounded mx-auto"></div></td>
                                    <td className="px-4 py-3 text-center"><div className="h-6 w-6 bg-muted/50 rounded mx-auto"></div></td>
                                </tr>
                            ))
                        ) : (
                            signals.map((signal, index) => {
                                const isBuy = signal.type === 'BUY';
                                const targets = signal.targets || {};
                                const targetPrice = targets.target1 || signal.target || '---';
                                const ltp = ltpData[signal.symbol]?.price;
                                const isHighlighted = highlightTerm && signal.symbol.toLowerCase().includes(highlightTerm.toLowerCase());
                                const generationTime = signal.createdAt || signal.timestamp;

                                return (
                                    <tr
                                        key={signal.id || index}
                                        onClick={() => onRowClick && onRowClick(signal)}
                                        className={`transition-all duration-300 group relative cursor-pointer ${isHighlighted ? 'bg-primary/5 shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)]' : 'hover:bg-primary/[0.02]'}`}
                                    >
                                        <td className="px-4 py-4 border-r border-border">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-sans font-extrabold text-sm tracking-tight">{signal.symbol}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">{signal.strategyName || 'MANUAL'}</span>
                                                    <span className="text-[9px] text-muted-foreground/60">•</span>
                                                    <span className="text-[9px] text-muted-foreground/60">{signal.timeframe || '---'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 border-r border-border text-center">
                                            <div className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded text-[10px] ${isBuy ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                                                {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {signal.type}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 border-r border-border text-right text-foreground font-bold font-mono">
                                            {signal.entry || '---'}
                                        </td>

                                        <td className="px-4 py-3 border-r border-border text-right">
                                            {ltp ? (
                                                <span className="text-foreground font-bold text-xs">{ltp.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-muted-foreground opacity-30">---</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 border-r border-border">
                                            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[9px] uppercase tracking-tighter font-bold">
                                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/20 border border-border/10">
                                                    <span className="text-muted-foreground">SMA</span>
                                                    <span className="text-blue-400">{signal.metrics?.sma ? signal.metrics.sma.toFixed(1) : '---'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/20 border border-border/10">
                                                    <span className="text-muted-foreground">EMA</span>
                                                    <span className="text-violet-400">{signal.metrics?.ema ? signal.metrics.ema.toFixed(1) : '---'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                                                    <span className="text-emerald-500/70">ST</span>
                                                    <span className="text-emerald-400">{signal.metrics?.supertrend ? signal.metrics.supertrend.toFixed(1) : '---'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-orange-500/5 border border-orange-500/10">
                                                    <span className="text-orange-500/70">RSI</span>
                                                    <span className="text-orange-400">{signal.metrics?.rsi ? signal.metrics.rsi.toFixed(0) : '---'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-blue-500/5 border border-blue-500/10">
                                                    <span className="text-blue-500/70">SAR</span>
                                                    <span className="text-blue-400">{signal.metrics?.psar ? signal.metrics.psar.toFixed(1) : '---'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-center border-r border-border text-emerald-500 font-bold bg-emerald-500/[0.03]">
                                            {targetPrice}
                                        </td>

                                        <td className="px-4 py-3 text-center border-r border-border text-red-500 font-bold bg-red-500/[0.03]">
                                            {signal.stoploss || '---'}
                                        </td>

                                        <td className="px-4 py-3 text-center border-r border-border">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-foreground/80 font-bold text-[10px]">{formatTime(generationTime)}</span>
                                                <span className="text-muted-foreground/50 text-[8px] uppercase">{getTimeAgo(generationTime)}</span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-center border-r border-border">
                                            <span className={clsx(
                                                "px-2 py-0.5 border rounded-full text-[8px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 w-fit mx-auto shadow-sm",
                                                signal.status === 'Active' ? 'border-primary/30 text-primary bg-primary/10' :
                                                    signal.status === 'Target Hit' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                                                        signal.status === 'Stoploss Hit' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                                                            'border-white/10 text-muted-foreground bg-white/5'
                                            )}>
                                                {signal.status === 'Active' && <Zap size={8} className="animate-pulse" />}
                                                {signal.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => toggleDropdown(signal.id, e)} className="p-1.5 hover:bg-muted/20 rounded-md text-muted-foreground hover:text-foreground transition-all">
                                                <MoreVertical size={14} />
                                            </button>
                                            {openDropdownId === signal.id && (
                                                <div ref={dropdownRef} className="absolute right-8 top-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
                                                    <button onClick={() => { onAction('updateStatus', signal, 'Target Hit'); setOpenDropdownId(null); }} className="px-3 py-2 text-[10px] hover:bg-emerald-500/10 hover:text-emerald-500 text-left flex items-center gap-2.5 font-bold border-b border-border/10">
                                                        <Target size={14} /> Target Hit
                                                    </button>
                                                    <button onClick={() => { onAction('updateStatus', signal, 'Stoploss Hit'); setOpenDropdownId(null); }} className="px-3 py-2 text-[10px] hover:bg-red-500/10 hover:text-red-500 text-left flex items-center gap-2.5 font-bold border-b border-border/10">
                                                        <AlertTriangle size={14} /> Stoploss Hit
                                                    </button>
                                                    <button onClick={() => { onAction('close', signal); setOpenDropdownId(null); }} className="px-3 py-2 text-[10px] hover:bg-muted/20 text-left flex items-center gap-2.5 font-bold border-b border-border/10">
                                                        <XCircle size={14} /> Force Close
                                                    </button>
                                                    <button onClick={() => { onAction('delete', signal); setOpenDropdownId(null); }} className="px-3 py-2 text-[10px] hover:bg-red-500/10 text-red-500 text-left flex items-center gap-2.5 font-black">
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
