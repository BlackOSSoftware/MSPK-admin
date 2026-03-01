import React from 'react';
import { Eye, Edit, Ban, AlertTriangle, ShieldAlert, UserCheck, Key, Hash, Users, User, Globe, CreditCard, Calendar, Clock, Activity, Shield, Settings, Trash2 } from 'lucide-react';
import TableHeaderCell from '../ui/TableHeaderCell';
import TablePageFooter from '../ui/TablePageFooter';

const UserTable = ({
    users,
    onAction,
    isLoading,
    highlightTerm,
    footerProps,
}) => {
    const getInitials = (name, email) => {
        const source = name || email || 'User';
        const parts = source.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    };

    return (
        <div className="dashboard-surface w-full h-full min-h-[600px] border border-border/70 bg-card/90 rounded-2xl relative flex flex-col">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/70 bg-secondary/20 flex items-center justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Client Directory</p>
                    <p className="text-sm font-semibold text-foreground">All Users</p>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                    {isLoading ? 'Loading...' : `${users.length} users`}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto custom-scrollbar">
                    <table className="w-full min-w-[980px] text-left whitespace-nowrap">
                    <thead className="bg-gradient-to-r from-card via-card/95 to-primary/5 sticky top-0 z-10 uppercase tracking-[0.2em] text-[9px] font-semibold text-muted-foreground border-b border-border/70 backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5" icon={Hash} label="Client ID" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5" icon={Users} label="Sub Broker" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5" icon={User} label="Name / Contact" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 text-center" icon={Globe} label="IP Address" align="center" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 text-center" icon={CreditCard} label="Plan" align="center" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 text-center" icon={Calendar} label="Start Date" align="center" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 text-center" icon={Clock} label="Expiry Date" align="center" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 w-48" icon={Activity} label="Validity Progress" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 text-center" icon={Shield} label="Status" align="center" />
                            <TableHeaderCell className="px-3 sm:px-4 py-2 sm:py-2.5 text-center" icon={Settings} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-16 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-6 w-20 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-muted/50 rounded-full"></div>
                                            <div className="flex flex-col gap-1">
                                                <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                                <div className="h-3 w-24 bg-muted/50 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-5 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-4 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-full bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-5 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
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
                                        className={`transition-all duration-300 group relative ${isHighlighted ? 'bg-primary/10' : 'hover:bg-primary/5'} hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
                                    >
                                        <td className="px-3 sm:px-4 py-3 font-mono text-[11px] font-semibold text-foreground/90">
                                            <span className="inline-flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
                                                {user.clientId}
                                            </span>
                                        </td>

                                        {/* Sub Broker Column */}
                                        <td className="px-3 sm:px-4 py-3">
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full w-fit text-[9px] font-semibold uppercase tracking-wider border ${isDirect ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/40 text-muted-foreground border-border/70'}`}>
                                                <UserCheck size={10} />
                                                {isDirect ? 'DIRECT' : user.subBrokerName?.split(' ')[0]}
                                            </div>
                                        </td>

                                        <td className="px-3 sm:px-4 py-3 font-sans">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center">
                                                    {getInitials(user.name, user.email)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-foreground font-semibold text-xs truncate">{user.name || '—'}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">{user.email || '—'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-center font-mono text-[10px] text-muted-foreground">
                                            {user.ip === '::1' || user.ip === '127.0.0.1' ? 'Localhost' : (user.ip || '-')}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-center">
                                            <span className={`px-2.5 py-0.5 border rounded-full text-[9px] uppercase font-semibold tracking-wider ${user.plan === 'Gold' ? 'border-amber-500/20 text-amber-600 bg-amber-500/10' :
                                                user.plan === 'Platinum' ? 'border-sky-500/20 text-sky-600 bg-sky-500/10' :
                                                    user.plan === 'Silver' ? 'border-slate-400/20 text-slate-600 bg-slate-400/10' :
                                                        'border-border/70 text-muted-foreground bg-muted/30'
                                                }`}>
                                                {user.plan}
                                            </span>
                                        </td>

                                        {/* Start Date */}
                                        <td className="px-3 sm:px-4 py-3 text-center text-muted-foreground">
                                            {formatDate(user.subscriptionStart)}
                                        </td>

                                        {/* Expiry Date */}
                                        <td className="px-3 sm:px-4 py-3 text-center font-semibold text-foreground">
                                            {formatDate(user.subscriptionExpiry)}
                                        </td>

                                        {/* Validity Progress Bar */}
                                        <td className="px-3 sm:px-4 py-3">
                                            <div className="flex flex-col gap-1.5 w-full min-w-[140px]">
                                                <div className="flex justify-between items-center text-[9px] uppercase font-semibold">
                                                    <span className="text-muted-foreground">Active</span>
                                                    <span className={daysColor}>{daysText}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/40 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 sm:px-4 py-3 text-center">
                                            {isBlocked ? (
                                                <span className="text-muted-foreground bg-muted/30 border border-border/60 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase">BLOCKED</span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ACTIVE
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
                                                            className="p-1.5 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-md transition-all duration-200"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            title="Edit User"
                                                            onClick={() => onAction('edit', user)}
                                                            className="p-1.5 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-md transition-all duration-200"
                                                        >
                                                            <Edit size={14} />
                                                        </button>

                                                        <button
                                                            title={user.status === 'Blocked' ? "Unblock User" : "Block User"}
                                                            onClick={() => onAction('block', user)}
                                                            className={`p-1.5 rounded-md transition-all duration-200 ${user.status === 'Blocked' ? 'text-amber-600 bg-amber-500/10' : 'hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground'}`}
                                                        >
                                                            <Ban size={14} />
                                                        </button>

                                                        <button
                                                            title="Delete User"
                                                            onClick={() => onAction('delete', user)}
                                                            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground rounded-md transition-all duration-200"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}

                                                {user.role === 'admin' && (
                                                    <button
                                                        title="Change Password"
                                                        onClick={() => onAction('edit', user)}
                                                        className="p-1.5 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-md transition-all duration-200 flex items-center gap-1.5"
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

            {footerProps && (
                <div className="mt-2 shrink-0">
                    <TablePageFooter {...footerProps} />
                </div>
            )}
        </div>
    );
};

export default UserTable;
