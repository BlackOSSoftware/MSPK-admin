import React, { useEffect, useState } from 'react';
import {
    CheckCircle,
    XCircle,
    Trash2,
    Edit,
    TrendingUp,
    Activity,
    Globe,
    Tag,
    Layers,
    Settings,
    KeyRound,
    RefreshCw,
} from 'lucide-react';
import { socket } from '../../api/socket';
import TableHeaderCell from '../ui/TableHeaderCell';

const MarketTable = ({ symbols, onEdit, onDelete, onGenerateId, generatingIdFor, isLoading }) => {
    const [ltpData, setLtpData] = useState({});

    useEffect(() => {
        if (!symbols || symbols.length === 0) return;

        const uniqueSymbols = [...new Set(symbols.map((symbol) => symbol.symbol).filter(Boolean))];
        uniqueSymbols.forEach((symbol) => socket.emit('subscribe', symbol));

        const onTick = (data) => {
            if (uniqueSymbols.includes(data.symbol)) {
                setLtpData((prev) => ({
                    ...prev,
                    [data.symbol]: {
                        price: data.price,
                        change: data.change || 0,
                    },
                }));
            }
        };

        socket.on('tick', onTick);

        return () => {
            socket.off('tick', onTick);
            uniqueSymbols.forEach((symbol) => socket.emit('unsubscribe', symbol));
        };
    }, [symbols]);

    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border/70 bg-card/90 rounded-2xl relative flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gradient-to-r from-card via-card/95 to-primary/5 sticky top-0 z-10 uppercase tracking-[0.2em] text-[9px] font-semibold text-muted-foreground border-b border-border/70 backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Activity} label="Instrument" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={KeyRound} label="Symbol ID" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm text-right w-24" icon={TrendingUp} label="LTP" align="right" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Globe} label="Exchange" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Tag} label="Segment" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Layers} label="Lot Size" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={CheckCircle} label="Status" align="center" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={Settings} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-5 py-4 border-r border-border">
                                        <div className="space-y-2">
                                            <div className="h-3 w-24 bg-white/10 rounded" />
                                            <div className="h-2 w-16 bg-white/5 rounded" />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 border-r border-border">
                                        <div className="space-y-2">
                                            <div className="h-3 w-40 bg-white/5 rounded" />
                                            <div className="h-2 w-24 bg-white/5 rounded" />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-12 bg-white/5 rounded ml-auto" /></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-12 bg-white/5 rounded mx-auto" /></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-20 bg-white/5 rounded mx-auto" /></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-3 w-8 bg-white/5 rounded mx-auto" /></td>
                                    <td className="px-5 py-4 border-r border-border"><div className="h-5 w-16 bg-white/5 rounded mx-auto" /></td>
                                    <td className="px-5 py-4"><div className="h-4 w-20 bg-white/5 rounded mx-auto" /></td>
                                </tr>
                            ))
                        ) : (
                            symbols.map((symbol, index) => {
                                const livePrice = ltpData[symbol.symbol]?.price ?? symbol.ltp ?? symbol.lastPrice ?? 0;
                                const isHighPrecision = ['CURRENCY', 'FOREX', 'CRYPTO', 'BINANCE'].includes(symbol.segment?.toUpperCase()) || symbol.exchange === 'FOREX';
                                const precision = isHighPrecision ? 5 : 2;
                                const hasSymbolId = Boolean(symbol.symbolId);
                                const isGenerating = generatingIdFor === symbol._id;

                                return (
                                    <tr
                                        key={symbol._id || `${symbol.symbol}-${index}`}
                                        className="group relative transition-all duration-300 hover:bg-primary/[0.03] animate-in fade-in slide-in-from-bottom-1"
                                        style={{ animationDelay: `${Math.min(index * 20, 240)}ms` }}
                                    >
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-sans font-bold">{symbol.symbol}</span>
                                                <span className="text-[9px] text-muted-foreground">{symbol.name || symbol.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="max-w-[260px]">
                                                {hasSymbolId ? (
                                                    <>
                                                        <span className="block text-[10px] text-foreground break-all">{symbol.symbolId}</span>
                                                        <span className="block text-[9px] text-muted-foreground mt-1">Mongo: {symbol._id}</span>
                                                    </>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[9px] uppercase tracking-wider text-amber-500">
                                                        <KeyRound size={10} />
                                                        Missing ID
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-right">
                                            {Number.isFinite(Number(livePrice)) && Number(livePrice) > 0 ? (
                                                <span className="text-foreground font-bold animate-in fade-in">{Number(livePrice).toFixed(precision)}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-[9px] opacity-50">---</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[9px] font-bold text-muted-foreground">
                                                {symbol.exchange}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                            {symbol.segment}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border font-bold text-primary font-mono">
                                            {symbol.lotSize}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider inline-flex items-center justify-center gap-1.5 ${symbol.isActive
                                                ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                                : 'border-red-500/20 text-red-500 bg-red-500/5'
                                                }`}>
                                                {symbol.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                {symbol.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => onEdit && onEdit(symbol)}
                                                    className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-primary transition-all"
                                                    title="Edit Symbol"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onGenerateId && onGenerateId(symbol)}
                                                    disabled={!onGenerateId || isGenerating}
                                                    className="p-1.5 hover:bg-amber-500/10 rounded text-muted-foreground hover:text-amber-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    title={hasSymbolId ? 'Regenerate Symbol ID' : 'Generate Symbol ID'}
                                                >
                                                    {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => onDelete && onDelete(symbol)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-all"
                                                    title="Delete Symbol"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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

export default MarketTable;
