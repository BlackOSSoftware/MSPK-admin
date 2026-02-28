import React from 'react';
import { Clock, MoreVertical, CreditCard, AlertCircle } from 'lucide-react';

const ActiveSubscriptionsTable = ({ subscriptions, highlightTerm, isLoading }) => {
    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">User Identity</th>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">Current Plan</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Start Date</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Expiry Date</th>
                            <th className="px-5 py-3 border-r border-border w-48 bg-muted/90 backdrop-blur-sm">Validity Progress</th>
                            <th className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm">Last Login IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                            <div className="h-3 w-20 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 bg-muted/50 rounded-full"></div>
                                            <div className="h-4 w-24 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="flex justify-between">
                                                <div className="h-3 w-12 bg-muted/50 rounded"></div>
                                                <div className="h-3 w-16 bg-muted/50 rounded"></div>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted/50 rounded-full"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            subscriptions.map((sub, index) => {
                                // Calculate progress (mock logic)
                                const total = 30; // 30 days plan
                                const remaining = sub.daysRemaining;
                                const progress = ((total - remaining) / total) * 100;

                                const isHighlighted = highlightTerm && (
                                    (sub.user && sub.user.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (sub.userId && sub.userId.toLowerCase().includes(highlightTerm.toLowerCase()))
                                );

                                return (
                                    <tr key={index} className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-sans font-bold">{sub.user}</span>
                                                <span className="text-[9px] text-muted-foreground">{sub.userId}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={12} className="text-primary" />
                                                <span className="text-primary font-bold">{sub.plan}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                            {sub.startDate}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border font-bold text-foreground">
                                            {sub.expiryDate}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex justify-between text-[9px] uppercase font-bold text-muted-foreground">
                                                    <span>Active</span>
                                                    <span className={remaining < 5 ? "text-red-500" : "text-emerald-500"}>{remaining} Days Left</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${remaining < 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center text-muted-foreground">
                                            {sub.lastLoginIp || '-'}
                                        </td>
                                    </tr>
                                );
                            }))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActiveSubscriptionsTable;
