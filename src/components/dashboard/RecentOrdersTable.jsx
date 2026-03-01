import React from 'react';
import { ArrowRight, Hash, User, CreditCard, DollarSign, BadgeCheck, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import TableHeaderCell from '../ui/TableHeaderCell';

const StatusBadge = ({ status }) => {
    const styles = {
        Success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        Failed: 'bg-red-500/10 text-red-500 border-red-500/20',
        success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${styles[status] || styles['Pending']}`}>
            {status}
        </span>
    );
};

const RecentOrdersTable = ({ orders = [] }) => {
    return (
        <div className="dashboard-surface soft-shadow soft-shadow-hover h-full bg-card/90 border border-border/70 rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
            <div className="h-11 shrink-0 border-b border-border/70 px-4 flex items-center justify-between bg-secondary/30">
                <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-[0.2em]">Recent Transactions</h3>
                <Link to="/subscriptions/all" className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">View All <ArrowRight size={10} /></Link>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-secondary/20 text-[10px] uppercase tracking-wider text-muted-foreground font-medium sticky top-0 z-10">
                        <tr>
                            <TableHeaderCell className="px-4 py-2 font-medium border-b border-border" icon={Hash} label="Order ID" />
                            <TableHeaderCell className="px-4 py-2 font-medium border-b border-border" icon={User} label="User" />
                            <TableHeaderCell className="px-4 py-2 font-medium border-b border-border" icon={CreditCard} label="Plan" />
                            <TableHeaderCell className="px-4 py-2 font-medium border-b border-border" icon={DollarSign} label="Amount" />
                            <TableHeaderCell className="px-4 py-2 font-medium border-b border-border" icon={BadgeCheck} label="Status" />
                            <TableHeaderCell className="px-4 py-2 font-medium border-b border-border text-right" icon={Calendar} label="Date" align="right" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.length > 0 ? orders.map((order) => (
                            <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-4 py-2.5 text-[11px] font-mono text-muted-foreground group-hover:text-primary transition-colors">{order.id}</td>
                                <td className="px-4 py-2.5 text-xs font-medium text-foreground">{order.user}</td>
                                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{order.plan}</td>
                                <td className="px-4 py-2.5 text-[11px] font-mono font-medium text-foreground">{order.amount}</td>
                                <td className="px-4 py-2.5"><StatusBadge status={order.status} /></td>
                                <td className="px-4 py-2.5 text-[10px] text-muted-foreground text-right">
                                    {order.date ? format(new Date(order.date), 'MMM dd, hh:mm a') : 'N/A'}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-xs text-muted-foreground">No recent orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
};

export default RecentOrdersTable;
