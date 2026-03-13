import React from 'react';
import {
    Eye,
    Edit,
    Ban,
    UserCheck,
    Key,
    Hash,
    Users,
    User,
    Globe,
    CreditCard,
    Calendar,
    Clock,
    Activity,
    Shield,
    Settings,
    Trash2,
    Mail,
    Phone
} from 'lucide-react';
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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getSubscriptionMeta = (user) => {
        const hasSubscription = user.subscriptionStart && user.subscriptionExpiry;
        if (!hasSubscription) {
            return {
                percentage: 0,
                daysText: 'No Plan',
                daysColor: 'text-muted-foreground',
                progressColor: 'bg-muted'
            };
        }

        const start = new Date(user.subscriptionStart);
        const end = new Date(user.subscriptionExpiry);
        const today = new Date();

        const totalTime = end - start;
        const timeElapsed = today - start;
        let percentage = (timeElapsed / totalTime) * 100;
        percentage = Math.max(0, Math.min(100, percentage));

        const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;

        return {
            percentage,
            daysText: isExpired ? 'Expired' : `${daysLeft} Days Left`,
            daysColor: isExpired ? 'text-red-500' : (daysLeft < 7 ? 'text-red-400' : 'text-emerald-500'),
            progressColor: isExpired ? 'bg-red-500' : (daysLeft < 7 ? 'bg-red-500' : 'bg-emerald-500')
        };
    };

    return (
        <div className="dashboard-surface relative flex w-full flex-col rounded-2xl border border-border/70 bg-card/90">
            <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-secondary/20 px-3 py-2.5 sm:px-4 sm:py-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Client Directory</p>
                    <p className="text-xs font-semibold text-foreground sm:text-sm">All Users</p>
                </div>
                <div className="text-right text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                    {isLoading ? 'Loading...' : `${users.length} users`}
                </div>
            </div>

            <div className="space-y-3 p-2.5 md:hidden">
                {isLoading ? (
                    [...Array(6)].map((_, index) => (
                        <div key={`user-card-skeleton-${index}`} className="animate-pulse rounded-2xl border border-border/70 bg-card/70 p-3">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted/50" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-28 rounded bg-muted/50" />
                                    <div className="h-3 w-20 rounded bg-muted/40" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full rounded bg-muted/40" />
                                <div className="h-3 w-5/6 rounded bg-muted/40" />
                            </div>
                        </div>
                    ))
                ) : (
                    users.map((user) => {
                        const isBlocked = user.status === 'Blocked';
                        const isDirect = user.subBrokerId === 'DIRECT';

                        return (
                            <div key={user.id} className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-2.5 shadow-sm min-[360px]:p-3">
                                <div className="flex items-start gap-2.5 min-[360px]:gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary min-[360px]:h-10 min-[360px]:w-10">
                                        {getInitials(user.name, user.email)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-semibold text-foreground min-[360px]:text-xs">{user.name || '-'}</p>
                                                <p className="mt-0.5 truncate text-[9px] text-muted-foreground min-[360px]:text-[10px]">{user.clientId || '-'}</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase min-[360px]:px-2 min-[360px]:text-[9px] ${isBlocked ? 'border border-border/60 bg-muted/30 text-muted-foreground' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'}`}>
                                                {user.status || 'Active'}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-2 text-[9px] text-muted-foreground min-[360px]:text-[10px]">
                                            <div className="flex items-center gap-2">
                                                <Mail size={11} className="shrink-0" />
                                                <span className="truncate">{user.email || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={11} className="shrink-0" />
                                                <span className="truncate">{user.phone || '-'}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`max-w-full truncate rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase min-[360px]:text-[9px] ${isDirect ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border/70 bg-muted/30 text-muted-foreground'}`}>
                                                    {isDirect ? 'Direct' : user.subBrokerName || 'Broker'}
                                                </span>
                                                <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 text-[8px] font-semibold uppercase text-muted-foreground min-[360px]:text-[9px]">
                                                    {user.plan || 'Free'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-background/40 p-2">
                                                <div className="min-w-0">
                                                    <p className="text-[8px] uppercase text-muted-foreground min-[360px]:text-[9px]">Start</p>
                                                    <p className="mt-1 text-[9px] font-semibold text-foreground min-[360px]:text-[10px]">{formatDate(user.subscriptionStart)}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] uppercase text-muted-foreground min-[360px]:text-[9px]">Expiry</p>
                                                    <p className="mt-1 text-[9px] font-semibold text-foreground min-[360px]:text-[10px]">{formatDate(user.subscriptionExpiry)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => onAction('view', user)} className="rounded-xl border border-border/70 bg-background/50 px-2 py-2 text-[9px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary min-[360px]:text-[10px]">View</button>
                                    <button type="button" onClick={() => onAction('edit', user)} className="rounded-xl border border-border/70 bg-background/50 px-2 py-2 text-[9px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary min-[360px]:text-[10px]">Edit</button>
                                    <button type="button" onClick={() => onAction('block', user)} className="rounded-xl border border-border/70 bg-background/50 px-2 py-2 text-[9px] font-semibold text-muted-foreground transition hover:border-amber-500/40 hover:text-amber-600 min-[360px]:text-[10px]">{user.status === 'Blocked' ? 'Unblock' : 'Block'}</button>
                                    <button type="button" onClick={() => onAction('delete', user)} className="rounded-xl border border-border/70 bg-background/50 px-2 py-2 text-[9px] font-semibold text-rose-500 transition hover:border-rose-500/40 min-[360px]:text-[10px]">Delete</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="hidden overflow-visible md:block">
                <div className="overflow-x-auto overflow-y-visible [overscroll-behavior-x:contain] [overscroll-behavior-y:auto] touch-pan-y">
                    <table className="w-full min-w-[980px] whitespace-nowrap text-left">
                        <thead className="sticky top-0 z-10 border-b border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md">
                            <tr>
                                <TableHeaderCell className="px-3 py-2 sm:px-4 sm:py-2.5" icon={Hash} label="Client ID" />
                                <TableHeaderCell className="px-3 py-2 sm:px-4 sm:py-2.5" icon={Users} label="Sub Broker" />
                                <TableHeaderCell className="px-3 py-2 sm:px-4 sm:py-2.5" icon={User} label="Name / Contact" />
                                <TableHeaderCell className="px-3 py-2 text-center sm:px-4 sm:py-2.5" icon={Globe} label="IP Address" align="center" />
                                <TableHeaderCell className="px-3 py-2 text-center sm:px-4 sm:py-2.5" icon={CreditCard} label="Plan" align="center" />
                                <TableHeaderCell className="px-3 py-2 text-center sm:px-4 sm:py-2.5" icon={Calendar} label="Start Date" align="center" />
                                <TableHeaderCell className="px-3 py-2 text-center sm:px-4 sm:py-2.5" icon={Clock} label="Expiry Date" align="center" />
                                <TableHeaderCell className="w-48 px-3 py-2 sm:px-4 sm:py-2.5" icon={Activity} label="Validity Progress" />
                                <TableHeaderCell className="px-3 py-2 text-center sm:px-4 sm:py-2.5" icon={Shield} label="Status" align="center" />
                                <TableHeaderCell className="px-3 py-2 text-center sm:px-4 sm:py-2.5" icon={Settings} label="Actions" align="center" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium">
                            {isLoading ? (
                                [...Array(10)].map((_, index) => (
                                    <tr key={`skeleton-${index}`} className="animate-pulse">
                                        <td className="px-4 py-3">
                                            <div className="h-4 w-16 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-6 w-20 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted/50" />
                                                <div className="flex flex-col gap-1">
                                                    <div className="h-4 w-32 rounded bg-muted/50" />
                                                    <div className="h-3 w-24 rounded bg-muted/50" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="mx-auto h-4 w-24 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="mx-auto h-5 w-16 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="mx-auto h-4 w-20 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="mx-auto h-4 w-20 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 w-full rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="mx-auto h-5 w-20 rounded bg-muted/50" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <div className="h-6 w-6 rounded bg-muted/50" />
                                                <div className="h-6 w-6 rounded bg-muted/50" />
                                                <div className="h-6 w-6 rounded bg-muted/50" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                users.map((user) => {
                                    const isBlocked = user.status === 'Blocked';
                                    const isDirect = user.subBrokerId === 'DIRECT';
                                    const { percentage, daysText, daysColor, progressColor } = getSubscriptionMeta(user);
                                    const isHighlighted = highlightTerm && (
                                        (user.name && user.name.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                        (user.clientId && user.clientId.toLowerCase().includes(highlightTerm.toLowerCase()))
                                    );

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`group relative transition-all duration-300 ${isHighlighted ? 'bg-primary/10' : 'hover:bg-primary/5'} hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
                                        >
                                            <td className="px-3 py-3 font-mono text-[11px] font-semibold text-foreground/90 sm:px-4">
                                                <span className="inline-flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
                                                    {user.clientId}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3 sm:px-4">
                                                <div className={`flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${isDirect ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border/70 bg-muted/40 text-muted-foreground'}`}>
                                                    <UserCheck size={10} />
                                                    {isDirect ? 'DIRECT' : user.subBrokerName?.split(' ')[0]}
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 font-sans sm:px-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                                        {getInitials(user.name, user.email)}
                                                    </div>
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate text-xs font-semibold text-foreground">{user.name || '-'}</span>
                                                        <span className="truncate text-[10px] text-muted-foreground">{user.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono text-[10px] text-muted-foreground sm:px-4">
                                                {user.ip === '::1' || user.ip === '127.0.0.1' ? 'Localhost' : (user.ip || '-')}
                                            </td>
                                            <td className="px-3 py-3 text-center sm:px-4">
                                                <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${user.plan === 'Gold' ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' :
                                                    user.plan === 'Platinum' ? 'border-sky-500/20 bg-sky-500/10 text-sky-600' :
                                                        user.plan === 'Silver' ? 'border-slate-400/20 bg-slate-400/10 text-slate-600' :
                                                            'border-border/70 bg-muted/30 text-muted-foreground'
                                                    }`}>
                                                    {user.plan}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center text-muted-foreground sm:px-4">
                                                {formatDate(user.subscriptionStart)}
                                            </td>
                                            <td className="px-3 py-3 text-center font-semibold text-foreground sm:px-4">
                                                {formatDate(user.subscriptionExpiry)}
                                            </td>
                                            <td className="px-3 py-3 sm:px-4">
                                                <div className="flex min-w-[140px] w-full flex-col gap-1.5">
                                                    <div className="flex items-center justify-between text-[9px] font-semibold uppercase">
                                                        <span className="text-muted-foreground">Active</span>
                                                        <span className={daysColor}>{daysText}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/40">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 text-center sm:px-4">
                                                {isBlocked ? (
                                                    <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">BLOCKED</span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-600">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ACTIVE
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-3 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                                                    {user.role !== 'admin' && (
                                                        <>
                                                            <button
                                                                title="View Details"
                                                                onClick={() => onAction('view', user)}
                                                                className="rounded-md p-1.5 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                title="Edit User"
                                                                onClick={() => onAction('edit', user)}
                                                                className="rounded-md p-1.5 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Edit size={14} />
                                                            </button>

                                                            <button
                                                                title={user.status === 'Blocked' ? 'Unblock User' : 'Block User'}
                                                                onClick={() => onAction('block', user)}
                                                                className={`rounded-md p-1.5 transition-all duration-200 ${user.status === 'Blocked' ? 'bg-amber-500/10 text-amber-600' : 'text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600'}`}
                                                            >
                                                                <Ban size={14} />
                                                            </button>

                                                            <button
                                                                title="Delete User"
                                                                onClick={() => onAction('delete', user)}
                                                                className="rounded-md p-1.5 text-muted-foreground transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {user.role === 'admin' && (
                                                        <button
                                                            title="Change Password"
                                                            onClick={() => onAction('edit', user)}
                                                            className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
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
