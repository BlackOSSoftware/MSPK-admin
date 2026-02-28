import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${styles[status] || styles['Pending']}`}>
            {status}
        </span>
    );
};

const RecentOrdersTable = ({ orders = [] }) => {
    return (
        <div className="h-full bg-card border border-border rounded-xl shadow-xl flex flex-col overflow-hidden relative group hover:border-primary/50 transition-all duration-500">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="h-10 shrink-0 border-b border-border px-4 flex items-center justify-between bg-accent/5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Recent Transactions</h3>
                <Link to="/subscriptions/all" className="text-[10px] text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={10} /></Link>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-accent/5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2 font-medium border-b border-border">Order ID</th>
                            <th className="px-4 py-2 font-medium border-b border-border">User</th>
                            <th className="px-4 py-2 font-medium border-b border-border">Plan</th>
                            <th className="px-4 py-2 font-medium border-b border-border">Amount</th>
                            <th className="px-4 py-2 font-medium border-b border-border">Status</th>
                            <th className="px-4 py-2 font-medium border-b border-border text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.length > 0 ? orders.map((order) => (
                            <tr key={order.id} className="hover:bg-accent/5 transition-colors group">
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
