import React from 'react';
import { Eye, Edit, Ban, AlertTriangle, ShieldAlert, UserCheck, Key } from 'lucide-react';

const UserTable = ({ users, onAction, isLoading, highlightTerm }) => {
    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">Client ID</th>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">Sub Broker</th>
                            <th className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm">Name / Contact</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">IP Address</th>
                            <th className="px-5 py-3 border-r border-border text-right bg-muted/90 backdrop-blur-sm">Fund (Equity)</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Plan</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Start Date</th>
                            <th className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm">Expiry Date</th>
                            <th className="px-5 py-3 border-r border-border w-48 bg-muted/90 backdrop-blur-sm">Validity Progress</th>
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
                                        <div className="h-6 w-20 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                            <div className="h-3 w-24 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-right">
                                        <div className="h-4 w-20 bg-muted/50 rounded ml-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-5 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-full bg-muted/50 rounded"></div>
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
                            users.map((user) => {
                                // Status Logic
                                const isLiquidated = user.status === 'Liquidated';
                                const isBlocked = user.status === 'Blocked';

                                // Sub Broker Badge Logic
                                const isDirect = user.subBrokerId === 'DIRECT';

                                // Validity Progress Logic
                                const hasSubscription = user.subscriptionStart && user.subscriptionExpiry;

                                let start, end, today, totalTime, timeElapsed, percentage, daysLeft, isExpired, daysText, daysColor, progressColor;

                                if (hasSubscription) {
                                    start = new Date(user.subscriptionStart);
                                    end = new Date(user.subscriptionExpiry);
                                    today = new Date();

                                    totalTime = end - start;
                                    timeElapsed = today - start;

                                    // Prevent negative progress or > 100%
                                    percentage = (timeElapsed / totalTime) * 100;
                                    percentage = Math.max(0, Math.min(100, percentage));

                                    daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                                    isExpired = daysLeft < 0;

                                    daysText = isExpired ? "Expired" : `${daysLeft} Days Left`;
                                    daysColor = isExpired ? "text-red-500" : (daysLeft < 7 ? "text-red-400" : "text-emerald-500");
                                    progressColor = isExpired ? "bg-red-500" : (daysLeft < 7 ? "bg-red-500" : "bg-emerald-500");
                                } else {
                                    daysText = "No Plan";
                                    daysColor = "text-muted-foreground";
                                    percentage = 0;
                                    progressColor = "bg-muted";
                                }

                                // Date Format
                                const formatDate = (dateString) => {
                                    if (!dateString) return '-';
                                    const d = new Date(dateString);
                                    if (isNaN(d.getTime())) return '-';
                                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                };

                                const isHighlighted = highlightTerm && (
                                    (user.name && user.name.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (user.clientId && user.clientId.toLowerCase().includes(highlightTerm.toLowerCase()))
                                );

                                return (
                                    <tr
                                        key={user.id}
                                        className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}
                                    >
                                        <td className="px-5 py-3 text-primary font-bold tracking-tight border-r border-border relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/0 group-hover:bg-primary transition-colors"></div>
                                            {user.clientId}
                                        </td>

                                        {/* Sub Broker Column */}
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded w-fit text-[9px] font-bold uppercase tracking-wider ${isDirect ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                                <UserCheck size={10} />
                                                {isDirect ? 'DIRECT' : user.subBrokerName?.split(' ')[0]}
                                            </div>
                                        </td>

                                        <td className="px-5 py-3 border-r border-border font-sans">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-semibold text-xs">{user.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 border-r border-border text-center font-mono text-[10px] text-muted-foreground">
                                            {user.ip === '::1' || user.ip === '127.0.0.1' ? 'Localhost' : (user.ip || '-')}
                                        </td>
                                        <td className="px-5 py-3 text-right border-r border-border text-foreground/90 font-bold tracking-tight">₹{user.equity.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider ${user.plan === 'Gold' ? 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5' :
                                                user.plan === 'Platinum' ? 'border-cyan-500/20 text-cyan-500 bg-cyan-500/5' :
                                                    user.plan === 'Silver' ? 'border-slate-400/20 text-slate-400 bg-slate-400/5' :
                                                        'border-white/10 text-muted-foreground'
                                                }`}>
                                                {user.plan}
                                            </span>
                                        </td>

                                        {/* Start Date */}
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                            {formatDate(user.subscriptionStart)}
                                        </td>

                                        {/* Expiry Date */}
                                        <td className="px-5 py-3 text-center border-r border-border font-bold text-foreground">
                                            {formatDate(user.subscriptionExpiry)}
                                        </td>

                                        {/* Validity Progress Bar */}
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex flex-col gap-1.5 w-full min-w-[140px]">
                                                <div className="flex justify-between items-center text-[9px] uppercase font-bold">
                                                    <span className="text-muted-foreground">Active</span>
                                                    <span className={daysColor}>{daysText}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-3 text-center border-r border-border">
                                            {isLiquidated ? (
                                                <span className="flex items-center justify-center gap-1.5 text-red-500 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse">
                                                    <AlertTriangle size={10} /> LIQUIDATED
                                                </span>
                                            ) : isBlocked ? (
                                                <span className="text-muted-foreground bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase">BLOCKED</span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1.5 text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ACTIVE
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {user.role !== 'admin' && (
                                                    <>
                                                        <button
                                                            title="View Details"
                                                            onClick={() => onAction('view', user)}
                                                            className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground rounded-md transition-all duration-200"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            title="Edit User"
                                                            onClick={() => onAction('edit', user)}
                                                            className="p-1.5 hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground rounded-md transition-all duration-200"
                                                        >
                                                            <Edit size={14} />
                                                        </button>

                                                        <button
                                                            title={user.status === 'Blocked' ? "Unblock User" : "Block User"}
                                                            onClick={() => onAction('block', user)}
                                                            className={`p-1.5 rounded-md transition-all duration-200 ${user.status === 'Blocked' ? 'text-orange-500 bg-orange-500/10' : 'hover:bg-orange-500/10 hover:text-orange-500 text-muted-foreground'}`}
                                                        >
                                                            <Ban size={14} />
                                                        </button>

                                                        {user.status === 'Active' && (
                                                            <button
                                                                title="Liquidate Positions"
                                                                onClick={() => onAction('liquidate', user)}
                                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-all duration-200"
                                                            >
                                                                <ShieldAlert size={14} />
                                                            </button>
                                                        )}

                                                        <button
                                                            title="Delete User"
                                                            onClick={() => onAction('delete', user)}
                                                            className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-all duration-200"
                                                        >
                                                            <AlertTriangle size={14} />
                                                        </button>
                                                    </>
                                                )}

                                                {user.role === 'admin' && (
                                                    <button
                                                        title="Change Password"
                                                        onClick={() => onAction('edit', user)}
                                                        className="p-1.5 hover:bg-yellow-500/10 hover:text-yellow-500 text-muted-foreground rounded-md transition-all duration-200 flex items-center gap-1.5"
                                                    >
                                                        <Key size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Change Password</span>
                                                    </button>
                                                )}
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

export default UserTable;
