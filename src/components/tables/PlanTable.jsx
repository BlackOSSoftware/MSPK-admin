import React from 'react';
import { Edit, Trash2, CheckCircle, XCircle, CreditCard, Clock, Hash, Radio, DollarSign, Tag, List, Settings } from 'lucide-react';
import TableHeaderCell from '../ui/TableHeaderCell';

const PlanTable = ({ plans, onAction, isLoading, highlightTerm }) => {
    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Hash} label="Plan ID" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={CreditCard} label="Plan Name" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Radio} label="Segment" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={DollarSign} label="Price" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Clock} label="Validity" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Tag} label="Type" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={List} label="Features Included" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={Settings} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-12 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                            <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-5 w-16 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-5 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-48 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            plans.map((plan) => {
                                const isHighlighted = highlightTerm && plan.name.toLowerCase().includes(highlightTerm.toLowerCase());
                                return (
                                    <tr
                                        key={plan.id}
                                        className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}
                                    >
                                        <td className="px-5 py-3 font-bold text-muted-foreground border-r border-border font-mono text-[10px]">
                                            {plan.id ? plan.id : `PLN-${plan._id ? plan._id.toString().slice(-4).toUpperCase() : '???'}`}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-md ${plan.isDemo ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    <CreditCard size={14} />
                                                </div>
                                                <span className="text-foreground font-semibold font-sans text-xs">{plan.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <span className="px-2 py-0.5 rounded-[4px] bg-secondary/50 border border-white/5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                                {plan.segment}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border font-bold text-foreground">
                                            ₹ {plan.price}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                            <div className="flex items-center justify-center gap-1">
                                                <Clock size={12} />
                                                {plan.durationDays} Days
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider ${plan.isDemo
                                                ? 'border-blue-500/20 text-blue-500 bg-blue-500/5'
                                                : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                                }`}>
                                                {plan.isDemo ? 'Demo' : 'Premium'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border max-w-[200px]" title={plan.features.join('\n')}>
                                            <div className="truncate text-muted-foreground italic cursor-help">
                                                {plan.features.join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    title="Edit Plan"
                                                    onClick={() => onAction('edit', plan)}
                                                    className="p-1.5 hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground rounded-md transition-all duration-200"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    title="Delete Plan"
                                                    onClick={() => onAction('delete', plan)}
                                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-all duration-200"
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

export default PlanTable;
