import React from 'react';
import { Download, ShoppingCart, RefreshCcw, CheckCircle, XCircle, Hash, User, CreditCard, DollarSign, Calendar, Wallet, BadgeCheck, Mail } from 'lucide-react';
import TableHeaderCell from '../ui/TableHeaderCell';
import TablePageFooter from '../ui/TablePageFooter';

const SubscriptionTable = ({ transactions, highlightTerm, isLoading, footerProps }) => {
    return (
        <div className="terminal-panel w-full h-full min-h-[600px] border border-border/70 bg-card/90 rounded-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Hash} label="Transaction ID" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={User} label="User Name" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Mail} label="Email" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={CreditCard} label="Plan" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={DollarSign} label="Amount" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Calendar} label="Date" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Wallet} label="Method" align="center" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={BadgeCheck} label="Status" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-20 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="h-5 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            transactions.map((txn, index) => {
                                const isHighlighted = highlightTerm && (
                                    (txn.id && txn.id.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (txn.user && txn.user.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (txn.email && txn.email.toLowerCase().includes(highlightTerm.toLowerCase()))
                                );

                                return (
                                    <tr key={index} className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}>
                                        <td className="px-5 py-3 font-bold text-muted-foreground border-r border-border font-mono relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/0 group-hover:bg-primary transition-colors"></div>
                                            {txn.id}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-foreground font-sans font-semibold">
                                            {txn.user}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-muted-foreground font-mono text-[10px]">
                                            {txn.email || '-'}
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-primary">
                                            {txn.plan}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border font-bold text-emerald-500 font-mono">
                                            {txn.amount}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground text-[10px]">
                                            {txn.date}
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground text-[10px]">
                                            {txn.method || 'UPI'}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {(() => {
                                                const status = (txn.status || '').toLowerCase();
                                                const isActive = status === 'active' || status === 'success';
                                                const isPending = status === 'pending';
                                                const statusClass = isActive
                                                    ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                                    : isPending
                                                        ? 'border-amber-500/20 text-amber-500 bg-amber-500/5'
                                                        : 'border-red-500/20 text-red-500 bg-red-500/5';

                                                return (
                                                    <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 w-fit mx-auto ${statusClass}`}>
                                                        {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                        {txn.status}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                );
                            }))}
                    </tbody>
                    </table>
                </div>
            </div>

            {footerProps && (
                <div className="mt-2 shrink-0">
                    <TablePageFooter {...footerProps} />
                </div>
            )}
        </div >
    );
};

export default SubscriptionTable;
