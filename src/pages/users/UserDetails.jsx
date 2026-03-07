import React, { useEffect, useState } from 'react';
import {
    Activity,
    ArrowLeft,
    BadgeCheck,
    Bell,
    CalendarClock,
    CheckCircle2,
    CreditCard,
    Edit,
    Globe,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Shield,
    Smartphone,
    TrendingUp,
    User2,
    Wallet,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import SubscriptionHistory from './SubscriptionHistory';
import UserSignalDeliveries from './UserSignalDeliveries';

const TABS = [
    { key: 'overview', label: 'Overview', icon: User2 },
    { key: 'deliveries', label: 'Signal Deliveries', icon: Bell },
    { key: 'history', label: 'Subscription History', icon: CreditCard },
];

const formatDate = (value, withTime = false) => {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime
            ? {
                hour: '2-digit',
                minute: '2-digit',
            }
            : {}),
    });
};

const formatCurrency = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'INR 0';
    return `INR ${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numeric)}`;
};

const formatNumber = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numeric);
};

const formatIp = (value) => {
    if (!value) return 'Not captured';
    if (value === '::1' || value === '127.0.0.1') return 'Localhost';
    return value;
};

const formatLocation = (profile = {}) => {
    const parts = [profile.city, profile.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
};

const getInitials = (name, email) => {
    const source = (name || email || 'User').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getStatusTone = (status) => {
    switch (status) {
        case 'Blocked':
            return 'border-rose-500/20 bg-rose-500/10 text-rose-500';
        case 'Suspended':
        case 'Inactive':
            return 'border-amber-500/20 bg-amber-500/10 text-amber-500';
        case 'Liquidated':
            return 'border-red-500/20 bg-red-500/10 text-red-500';
        default:
            return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500';
    }
};

const getPlanTone = (planStatus) => {
    return planStatus === 'Active'
        ? 'border-primary/20 bg-primary/10 text-primary'
        : 'border-border/70 bg-secondary/30 text-muted-foreground';
};

const getProgressState = (startValue, endValue) => {
    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        return {
            percentage: 0,
            label: 'No active subscription window',
            tone: 'bg-muted',
            textTone: 'text-muted-foreground',
        };
    }

    const now = new Date();
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percentage = Math.max(0, Math.min((elapsed / totalDuration) * 100, 100));
    const msLeft = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return {
            percentage: 100,
            label: 'Expired',
            tone: 'bg-rose-500',
            textTone: 'text-rose-500',
        };
    }

    if (daysLeft <= 7) {
        return {
            percentage,
            label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`,
            tone: 'bg-amber-500',
            textTone: 'text-amber-500',
        };
    }

    return {
        percentage,
        label: `${daysLeft} days left`,
        tone: 'bg-emerald-500',
        textTone: 'text-emerald-500',
    };
};

const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
        <div className="mt-0.5 h-8 w-8 shrink-0 rounded-xl border border-border/70 bg-background/70 grid place-items-center">
            <Icon size={14} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">{label}</p>
            <p className={`mt-1 text-sm text-foreground break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value || '---'}</p>
        </div>
    </div>
);

const MetricCard = ({ icon: Icon, label, value, hint, toneClass = 'text-primary' }) => (
    <Card className="border-border/70 bg-card/90">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">{label}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-2xl border border-border/70 bg-secondary/30 grid place-items-center">
                <Icon size={18} className={toneClass} />
            </div>
        </div>
    </Card>
);

const UserDetails = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();

    const userId = searchParams.get('id');
    const requestedTab = searchParams.get('tab');
    const activeTab = TABS.some((tab) => tab.key === requestedTab) ? requestedTab : 'overview';

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const loadUser = async () => {
        if (!userId) {
            setLoading(false);
            setErrorMessage('Missing user id');
            return;
        }

        setLoading(true);
        try {
            const { fetchUserById } = await import('../../api/users.api');
            const { data } = await fetchUserById(userId);
            setUser(data);
            setErrorMessage('');
        } catch (error) {
            console.error('Failed to load user details', error);
            const message = error.response?.data?.message || 'Failed to load user details';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, [userId]);

    const handleTabChange = (tabKey) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', tabKey);
        if (userId) {
            nextParams.set('id', userId);
        }
        setSearchParams(nextParams);
    };

    const progressState = getProgressState(user?.subscriptionStart, user?.subscriptionExpiry);
    const verificationSummary = [
        user?.isEmailVerified ? 'Email verified' : 'Email pending',
        user?.isPhoneVerified ? 'Phone verified' : 'Phone pending',
    ].join(' • ');

    if (loading) {
        return (
            <div className="space-y-4">
                <Card className="min-h-[220px] animate-pulse">
                    <div className="h-6 w-40 rounded bg-muted/50" />
                    <div className="mt-4 h-14 w-72 rounded bg-muted/40" />
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="h-20 rounded-xl bg-muted/40" />
                        ))}
                    </div>
                </Card>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, index) => (
                        <Card key={index} className="min-h-[220px] animate-pulse">
                            <div className="h-5 w-36 rounded bg-muted/50" />
                            <div className="mt-4 space-y-3">
                                {[...Array(4)].map((__, rowIndex) => (
                                    <div key={rowIndex} className="h-14 rounded-xl bg-muted/40" />
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!userId || (!user && errorMessage)) {
        return (
            <Card className="max-w-2xl mx-auto mt-10">
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">User Details</p>
                        <h1 className="text-2xl font-bold text-foreground mt-1">Unable to load profile</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">{errorMessage || 'User id is missing from the URL.'}</p>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={() => navigate('/users/all')}>
                            <ArrowLeft size={14} /> Back to Users
                        </Button>
                        <Button size="sm" onClick={loadUser}>
                            <RefreshCw size={14} /> Retry
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="min-h-full flex flex-col gap-4 pb-4">
            <div className="shrink-0 min-h-[220px] relative overflow-hidden rounded-3xl border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88),rgba(14,116,144,0.92))] p-4 sm:p-5">
                <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />
                <div className="relative flex flex-col gap-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="h-16 w-16 shrink-0 rounded-3xl border border-white/15 bg-white/10 backdrop-blur grid place-items-center text-white text-lg font-bold">
                                {getInitials(user.name, user.email)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300/80 font-semibold">Client Profile</p>
                                <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white truncate">{user.name || 'Unnamed User'}</h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-slate-100">
                                        {user.clientId || user.id}
                                    </span>
                                    <span className={`rounded-full px-2.5 py-1 font-semibold border ${getStatusTone(user.status)}`}>
                                        {user.status || 'Active'}
                                    </span>
                                    <span className={`rounded-full px-2.5 py-1 font-semibold border ${getPlanTone(user.planStatus)}`}>
                                        {user.plan || 'Free'}
                                    </span>
                                </div>
                                <p className="mt-3 max-w-3xl text-sm text-slate-300">
                                    Complete client snapshot with identity, contact details, broker mapping, account health, subscription history, and paginated signal delivery records.
                                </p>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                                    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 backdrop-blur">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/70 font-semibold">Email</p>
                                        <p className="mt-1 text-sm text-white break-all">{user.email || 'Not provided'}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 backdrop-blur">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/70 font-semibold">Phone</p>
                                        <p className="mt-1 text-sm text-white">{user.phone || 'Not provided'}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 backdrop-blur">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/70 font-semibold">Broker</p>
                                        <p className="mt-1 text-sm text-white">{user.subBrokerName || 'Direct Client'}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2.5 backdrop-blur">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/70 font-semibold">Last Login IP</p>
                                        <p className="mt-1 text-sm text-white break-all">{formatIp(user.ip)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="gap-2 !border-white/20 !text-white hover:!bg-white/10" onClick={() => navigate('/users/all')}>
                                <ArrowLeft size={14} /> Back
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 !border-white/20 !text-white hover:!bg-white/10" onClick={loadUser}>
                                <RefreshCw size={14} /> Refresh
                            </Button>
                            <Button size="sm" className="gap-2" onClick={() => navigate(`/users/edit?id=${user.id}`)}>
                                <Edit size={14} /> Edit User
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <MetricCard
                            icon={CreditCard}
                            label="Current Plan"
                            value={user.plan || 'Free'}
                            hint={user.planStatus === 'Active' ? `Active till ${formatDate(user.subscriptionExpiry)}` : 'No active paid plan'}
                            toneClass="text-primary"
                        />
                        <MetricCard
                            icon={Shield}
                            label="Account Status"
                            value={user.status || 'Active'}
                            hint={verificationSummary}
                            toneClass="text-amber-500"
                        />
                        <MetricCard
                            icon={Wallet}
                            label="Wallet Balance"
                            value={formatCurrency(user.walletBalance)}
                            hint={`Equity ${formatCurrency(user.equity)}`}
                            toneClass="text-emerald-500"
                        />
                        <MetricCard
                            icon={BadgeCheck}
                            label="Subscriptions Logged"
                            value={`${user?.subscriptionHistory?.length || 0}`}
                            hint={`Joined ${formatDate(user.joinDate)}`}
                            toneClass="text-sky-500"
                        />
                    </div>
                </div>
            </div>

            <div className="shrink-0 dashboard-surface rounded-2xl border border-border/70 bg-card/90 p-2">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${isActive
                                    ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.18)]'
                                    : 'border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-secondary/40 hover:text-foreground'
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <Card className="xl:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Identity</p>
                                <h2 className="text-lg font-bold text-foreground mt-1">Profile Snapshot</h2>
                            </div>
                            <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] border ${getStatusTone(user.status)}`}>
                                {user.role || 'user'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <InfoRow icon={Mail} label="Email" value={user.email} />
                            <InfoRow icon={Phone} label="Phone" value={user.phone || 'Not provided'} mono />
                            <InfoRow icon={User2} label="TradingView ID" value={user.tradingViewId || 'Not linked'} mono />
                            <InfoRow icon={Activity} label="Client ID" value={user.clientId || user.id} mono />
                            <InfoRow icon={Globe} label="Last Login IP" value={formatIp(user.ip)} mono />
                            <InfoRow icon={CalendarClock} label="Joined On" value={formatDate(user.joinDate, true)} />
                        </div>
                    </Card>

                    <Card className="xl:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Subscription</p>
                                <h2 className="text-lg font-bold text-foreground mt-1">Plan Window</h2>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] border ${getPlanTone(user.planStatus)}`}>
                                {user.planStatus || 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <InfoRow icon={CreditCard} label="Plan Name" value={user.plan || 'Free'} />
                            <InfoRow icon={Wallet} label="Active Plan Value" value={formatCurrency(user.planPrice)} />
                            <InfoRow icon={CalendarClock} label="Subscription Start" value={formatDate(user.subscriptionStart, true)} />
                            <InfoRow icon={CalendarClock} label="Subscription Expiry" value={formatDate(user.subscriptionExpiry, true)} />

                            <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-3">
                                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] font-semibold">
                                    <span className="text-muted-foreground">Validity Progress</span>
                                    <span className={progressState.textTone}>{progressState.label}</span>
                                </div>
                                <div className="mt-3 h-2 rounded-full bg-background/80 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${progressState.tone}`}
                                        style={{ width: `${progressState.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="xl:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Broker and Trading</p>
                                <h2 className="text-lg font-bold text-foreground mt-1">Operational View</h2>
                            </div>
                            <TrendingUp size={18} className="text-primary" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Wallet</p>
                                <p className="mt-2 text-lg font-bold text-foreground">{formatCurrency(user.walletBalance)}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Equity</p>
                                <p className="mt-2 text-lg font-bold text-foreground">{formatCurrency(user.equity)}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Margin Used</p>
                                <p className="mt-2 text-lg font-bold text-foreground">{formatCurrency(user.marginUsed)}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">PnL</p>
                                <p className={`mt-2 text-lg font-bold ${Number(user.pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {`${Number(user.pnl) >= 0 ? '+' : ''}${formatNumber(user.pnl)}`}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 space-y-3">
                            <InfoRow icon={Globe} label="Sub Broker" value={user.subBrokerName || 'Direct Client'} />
                            <InfoRow icon={Shield} label="Broker Client ID" value={user.subBrokerClientId || 'Not assigned'} mono />
                            <InfoRow icon={MapPin} label="Location" value={formatLocation(user.profile)} />
                            <InfoRow icon={Smartphone} label="Current Device" value={user.currentDeviceId || 'Not captured'} mono />
                            <InfoRow icon={CheckCircle2} label="Verification" value={verificationSummary} />
                        </div>
                    </Card>

                    <Card className="xl:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">History</p>
                                <h2 className="text-lg font-bold text-foreground mt-1">Subscription Log</h2>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleTabChange('history')}>
                                <CreditCard size={14} /> View All
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {(user?.subscriptionHistory || []).slice(0, 4).map((item) => (
                                <div key={item.id} className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.plan}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.date, true)}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] border ${item.status === 'active'
                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                                            : 'border-border/70 bg-background/70 text-muted-foreground'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Amount: <span className="font-semibold text-foreground">{item.amount || '---'}</span>
                                    </div>
                                </div>
                            ))}
                            {(user?.subscriptionHistory || []).length === 0 && (
                                <div className="rounded-xl border border-dashed border-border/70 bg-secondary/20 px-4 py-8 text-sm text-muted-foreground">
                                    No subscription history is available for this account.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'deliveries' && (
                <div className="min-h-[760px]">
                    <UserSignalDeliveries userId={user.id} isEmbedded />
                </div>
            )}

            {activeTab === 'history' && (
                <div className="min-h-[560px]">
                    <SubscriptionHistory isEmbedded data={user?.subscriptionHistory || []} />
                </div>
            )}
        </div>
    );
};

export default UserDetails;
