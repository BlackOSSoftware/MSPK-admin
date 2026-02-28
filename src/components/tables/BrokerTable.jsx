import React from 'react';
import { MoreVertical, CheckCircle, XCircle, Users, TrendingUp, AlertCircle, Percent, DollarSign, IndianRupee, Trash2, Eye, Pencil } from 'lucide-react';
import { clsx } from 'clsx';

const BrokerTable = ({ brokers, onAction, isLoading, highlightTerm }) => {
    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">Broker ID</th>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">Broker Name</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Clients</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Commission</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Total Revenue</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Status</th>
                            <th className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-16 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                            <div className="h-3 w-24 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-12 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-5 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-5 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            brokers.map((broker, index) => {
                                const isHighlighted = highlightTerm && (
                                    (broker.name && broker.name.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (broker.brokerId && broker.brokerId.toLowerCase().includes(highlightTerm.toLowerCase()))
                                );

                                return (
                                    <tr key={index} className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}>
                                        <td className="px-5 py-3 border-r border-border font-bold text-muted-foreground">
                                            {broker.brokerId || broker.id}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-foreground font-sans font-bold">{broker.name}</span>
                                                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                                    <span>{broker.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-center">
                                            <div className="flex items-center justify-center gap-1 font-bold text-foreground">
                                                <Users size={12} className="text-primary/70" />
                                                {broker.totalClients || 0}
                                            </div>
                                        </td>

                                        {/* Commission Column */}
                                        <td className="px-5 py-3 border-r border-border text-center">
                                            <div className={clsx(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold uppercase",
                                                broker.commission.type === 'PERCENTAGE' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                            )}>
                                                {broker.commission.type === 'PERCENTAGE' ? <Percent size={10} /> : <IndianRupee size={10} />}
                                                {broker.commission.value}{broker.commission.type === 'PERCENTAGE' ? '%' : ''}
                                            </div>
                                        </td>

                                        <td className="px-5 py-3 border-r border-border text-center text-emerald-500 font-bold">
                                            ₹ {(broker.totalRevenue || 0).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={clsx(
                                                "px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 w-fit mx-auto",
                                                broker.status === 'Active' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                                                    broker.status === 'Inactive' ? 'text-slate-400 bg-slate-500/10 border-slate-500/20' :
                                                        'text-red-500 bg-red-500/10 border-red-500/20'
                                            )}>
                                                {broker.status === 'Active' && <CheckCircle size={10} />}
                                                {broker.status === 'Inactive' && <AlertCircle size={10} />}
                                                {broker.status === 'Blocked' && <XCircle size={10} />}
                                                {broker.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => onAction('view', broker)}
                                                    className="p-1.5 hover:bg-blue-500/10 rounded text-muted-foreground hover:text-blue-400 transition-all" title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onAction('edit', broker)}
                                                    className="p-1.5 hover:bg-emerald-500/10 rounded text-muted-foreground hover:text-emerald-400 transition-all" title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onAction('delete', broker)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-400 transition-all" title="Delete"
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

export default BrokerTable;
