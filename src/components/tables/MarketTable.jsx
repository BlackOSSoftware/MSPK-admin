import React, { useState, useEffect } from 'react';
import { MoreVertical, CheckCircle, XCircle, Trash2, Edit, TrendingUp, TrendingDown, Activity, Globe, Tag, Layers, Radio, Settings } from 'lucide-react';
import { socket } from '../../api/socket';
import TableHeaderCell from '../ui/TableHeaderCell';

const MarketTable = ({ symbols, onEdit, onDelete, isLoading }) => {
    const [ltpData, setLtpData] = useState({});

    // Socket Connection for LTP
    useEffect(() => {
        if (!symbols || symbols.length === 0) return;

        // Get unique symbols
        const uniqueSymbols = [...new Set(symbols.map(s => s.symbol))];

        // Subscribe
        uniqueSymbols.forEach(sym => socket.emit('subscribe', sym));

        const onTick = (data) => {
            if (uniqueSymbols.includes(data.symbol)) {
                setLtpData(prev => ({
                    ...prev,
                    [data.symbol]: {
                        price: data.price,
                        change: data.change || 0
                    }
                }));
            }
        };

        socket.on('tick', onTick);

        return () => {
            socket.off('tick', onTick);
            uniqueSymbols.forEach(sym => socket.emit('unsubscribe', sym));
        };
    }, [symbols]);

    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Activity} label="Instrument" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm text-right w-24" icon={TrendingUp} label="LTP" align="right" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Globe} label="Exchange" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Tag} label="Segment" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Layers} label="Lot Size" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Radio} label="Data Feed" align="center" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={Settings} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-5 py-4 border-r border-border">
                                        <div className="space-y-2">
                                            <div className="h-3 w-24 bg-white/10 rounded"></div>
                                            <div className="h-2 w-16 bg-white/5 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-12 bg-white/5 rounded mx-auto"></div></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-12 bg-white/5 rounded mx-auto"></div></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-20 bg-white/5 rounded mx-auto"></div></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-8 bg-white/5 rounded mx-auto"></div></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-5 w-16 bg-white/5 rounded mx-auto"></div></td>
                                    <td className="px-5 py-4"><div className="h-4 w-12 bg-white/5 rounded mx-auto"></div></td>
                                </tr>
                            ))
                        ) : (
                            symbols.map((sym, index) => {
                                const ltp = ltpData[sym.symbol]?.price;
                                const isHighPrecision = ['CURRENCY', 'FOREX', 'CRYPTO', 'BINANCE'].includes(sym.segment?.toUpperCase()) || sym.exchange === 'FOREX';
                                const precision = isHighPrecision ? 5 : 2;

                                return (
                                    <tr key={index} className="hover:bg-primary/[0.02] transition-colors group relative">
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-sans font-bold">{sym.symbol}</span>
                                                <span className="text-[9px] text-muted-foreground">{sym.name || sym.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-right">
                                            {ltp ? (
                                                <span className="text-foreground font-bold animate-in fade-in">{ltp.toFixed(precision)}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-[9px] opacity-50">---</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[9px] font-bold text-muted-foreground">
                                                    {sym.exchange}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                            {sym.segment}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border font-bold text-primary font-mono">
                                            {sym.lotSize}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 w-fit mx-auto ${sym.isActive
                                                ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                                : 'border-red-500/20 text-red-500 bg-red-500/5'
                                                }`}>
                                                {sym.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                {sym.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => onEdit && onEdit(sym)}
                                                    className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-primary transition-all"
                                                    title="Edit Symbol"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete && onDelete(sym)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-all"
                                                    title="Delete Symbol"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}

                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarketTable;
