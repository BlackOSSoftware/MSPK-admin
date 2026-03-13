import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Users, Activity, XCircle, Sparkles, TrendingUp, CheckCircle, UserCheck, RefreshCw, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserTable from '../../components/tables/UserTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Blocked'];

const UsersList = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blocked: 0 });
    const [subBrokers, setSubBrokers] = useState([{ value: 'All', label: 'All Brokers' }, { value: 'DIRECT', label: 'Direct Clients' }]);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('All');
    const [subBrokerFilter, setSubBrokerFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(20);
    const toast = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const buildQueryParams = useCallback(() => {
        const params = {};
        if (filter !== 'All') params.status = filter;
        if (subBrokerFilter !== 'All') params.subBrokerId = subBrokerFilter;
        if (searchTerm) params.search = searchTerm;
        return params;
    }, [filter, subBrokerFilter, searchTerm]);

    const loadData = useCallback(async (mode = 'initial') => {
        try {
            if (mode === 'initial') setIsLoading(true);
            else setIsRefreshing(true);

            const { fetchUsers } = await import('../../api/users.api');
            const { fetchSubBrokers } = await import('../../api/subbrokers.api');

            const [usersRes, sbRes] = await Promise.all([
                fetchUsers(buildQueryParams()),
                fetchSubBrokers()
            ]);

            const payload = usersRes.data || {};
            setUsers(payload.results || []);
            setStats(payload.stats || { total: 0, active: 0, inactive: 0, blocked: 0 });

            const sbOptions = (sbRes.data || []).map((sb) => ({
                value: sb.id,
                label: `${sb.name} (${sb.clientId})`
            }));

            setSubBrokers([
                { value: 'All', label: 'All Brokers' },
                { value: 'DIRECT', label: 'Direct Clients' },
                ...sbOptions
            ]);
        } catch (e) {
            console.error('Failed to load users data', e);
            toast.error(mode === 'initial' ? 'Failed to load users.' : 'Failed to refresh users.');
        } finally {
            if (mode === 'initial') setIsLoading(false);
            else setIsRefreshing(false);
        }
    }, [buildQueryParams, toast]);

    useEffect(() => {
        loadData('initial');
    }, [loadData]);

    const handleAction = async (action, user) => {
        if (action === 'view') {
            navigate(`/users/details?id=${user.id}`);
        } else if (action === 'edit') {
            navigate(`/users/edit?id=${user.id}`);
        } else if (action === 'delete') {
            setPendingAction({ type: 'delete', user });
            setDialogConfig({
                title: 'Delete Client',
                message: `Are you sure you want to PERMANENTLY DELETE ${user.name}? This action cannot be undone and will remove all subscription data.`,
                variant: 'danger',
                confirmText: 'Delete Client'
            });
            setDialogOpen(true);
        } else if (action === 'block') {
            const isBlocking = user.status !== 'Blocked';
            setPendingAction({ type: 'block', user });
            setDialogConfig({
                title: isBlocking ? 'Block Client' : 'Unblock Client',
                message: `Are you sure you want to ${isBlocking ? 'BLOCK' : 'UNBLOCK'} ${user.name}? ${isBlocking ? 'They will not be able to login.' : 'They will regain access.'}`,
                variant: isBlocking ? 'danger' : 'primary',
                confirmText: isBlocking ? 'Block' : 'Unblock'
            });
            setDialogOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            const { deleteUser, blockUser } = await import('../../api/users.api');
            const { type, user } = pendingAction;

            if (type === 'delete') {
                await deleteUser(user.id);
                toast.success(`Client ${user.name} deleted successfully`);
            } else if (type === 'block') {
                await blockUser(user.id);
                toast.success(`Client status updated for ${user.name}`);
            }

            setDialogOpen(false);
            loadData('refresh');
        } catch (error) {
            console.error('Action failed', error);
            const msg = error.response?.data?.message || error.message;
            toast.error(`Action failed: ${msg}`);
            setDialogOpen(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const { exportUsers } = await import('../../api/users.api');
            await exportUsers(buildQueryParams());
            toast.success('Users export downloaded successfully');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export users');
        } finally {
            setIsExporting(false);
        }
    };

    const totalUsers = stats.total || 0;
    const activeCount = stats.active || 0;
    const inactiveCount = stats.inactive || 0;
    const blockedCount = stats.blocked || 0;
    const toneStyles = {
        emerald: { box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', bar: 'bg-emerald-500/70' },
        primary: { box: 'bg-primary/10 border-primary/20', text: 'text-primary', bar: 'bg-primary/70' },
        amber: { box: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', bar: 'bg-amber-500/70' },
        rose: { box: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-500', bar: 'bg-rose-500/70' },
        sky: { box: 'bg-sky-500/10 border-sky-500/20', text: 'text-sky-500', bar: 'bg-sky-500/70' }
    };

    const totalPages = Math.ceil(users.length / usersPerPage) || 1;
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, subBrokerFilter, searchTerm, usersPerPage]);

    return (
        <div className="flex flex-col gap-3 px-2 pb-4 sm:gap-4 sm:px-0">
            <div className="flex flex-col gap-4 shrink-0">
                <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-2.5 sm:p-4">
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                    <div className="mb-3 flex items-start justify-between gap-2 sm:items-center sm:gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 sm:h-9 sm:w-9">
                                <Sparkles size={14} className="text-primary sm:h-4 sm:w-4" />
                            </div>
                            <div className="min-w-0 leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Overview</p>
                                <h2 className="truncate text-xs font-bold text-foreground min-[360px]:text-sm sm:text-base">Client Intelligence</h2>
                            </div>
                        </div>
                        <div className="hidden text-[10px] text-muted-foreground font-mono sm:block">
                            Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5 sm:gap-3">
                        {[
                            { label: 'Total Clients', value: `${totalUsers}`, icon: Users, tone: 'primary' },
                            { label: 'Active', value: `${activeCount}`, icon: CheckCircle, tone: 'emerald' },
                            { label: 'Inactive', value: `${inactiveCount}`, icon: XCircle, tone: 'amber' },
                            { label: 'Blocked', value: `${blockedCount}`, icon: XCircle, tone: 'rose' },
                            { label: 'Loaded', value: `${users.length}`, icon: UserCheck, tone: 'sky' }
                        ].map((card) => {
                            const tone = toneStyles[card.tone] || toneStyles.primary;
                            return (
                                <div key={card.label} className="rounded-xl border border-border/70 bg-card/60 p-2 sm:p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground font-semibold leading-tight sm:text-[9px] sm:tracking-wider">{card.label}</p>
                                            <p className="mt-0.5 text-sm font-bold text-foreground sm:text-lg">{card.value}</p>
                                        </div>
                                        <div className={`h-6 w-6 shrink-0 rounded-lg border grid place-items-center sm:h-8 sm:w-8 ${tone.box}`}>
                                            <card.icon size={13} className={tone.text} />
                                        </div>
                                    </div>
                                    <div className="mt-2 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                                        <div className={`h-full ${tone.bar}`} style={{ width: '70%' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-sm sm:p-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 sm:h-9 sm:w-9">
                                <TrendingUp size={14} className="text-primary sm:h-4 sm:w-4" />
                            </div>
                            <div className="min-w-0 leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Clients</p>
                                <h2 className="truncate text-xs font-bold text-foreground min-[360px]:text-sm sm:text-base">Client Database</h2>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 text-[10px]">
                            <span className="text-muted-foreground font-medium">Status:</span>
                            <div className="flex flex-wrap gap-1.5">
                            {STATUS_OPTIONS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition-all min-[360px]:px-2.5 min-[360px]:text-[10px] ${filter === f ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]' : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                >
                                    {f}
                                </button>
                            ))}
                            </div>
                        </div>

                        <div className="flex max-w-full flex-col gap-1.5 text-[10px] sm:max-w-xs">
                            <span className="text-muted-foreground font-medium">Broker:</span>
                            <div className="w-full min-w-0">
                                <SearchableSelect
                                    options={subBrokers}
                                    value={subBrokerFilter}
                                    onChange={setSubBrokerFilter}
                                    placeholder="Filter by Broker..."
                                    searchPlaceholder="Search Broker..."
                                    buttonClassName="min-h-[34px] py-1.5 text-[10px] rounded bg-secondary/40 border border-white/5 hover:border-primary/40 transition-all"
                                    dropdownClassName="min-w-[180px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:justify-end lg:gap-3">
                        <div className="relative col-span-full min-w-0">
                            <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                type="text"
                                placeholder="SEARCH USER / CLIENT ID / EMAIL..."
                                className="h-8 w-full rounded-lg border border-white/5 bg-secondary/30 pl-9 pr-7 text-[10px] font-mono focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50 min-[360px]:text-[11px] lg:w-64"
                            />
                            {searchInput && (
                                <button onClick={() => setSearchInput('')} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-all">
                                    <XCircle size={12} className="opacity-50 hover:opacity-100" />
                                </button>
                            )}
                        </div>

                        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="h-8 w-full min-w-0 text-[10px] gap-1.5 rounded-lg px-2 font-bold justify-center btn-cancel min-[360px]:text-[11px] lg:w-auto">
                            <Download size={12} /> {isExporting ? 'Exporting...' : 'Export CSV'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/users/create')} className="h-8 w-full min-w-0 text-[10px] gap-1.5 rounded-lg px-2 font-bold justify-center btn-cancel min-[360px]:text-[11px] lg:w-auto">
                            <Plus size={12} /> New Client
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => loadData('refresh')} disabled={isRefreshing} className="h-8 w-full min-w-0 text-[10px] gap-1.5 rounded-lg px-2 font-bold justify-center btn-cancel min-[360px]:text-[11px] lg:w-auto">
                            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div>
                    <div>
                        <UserTable
                            users={currentUsers}
                            onAction={handleAction}
                            isLoading={isLoading}
                            highlightTerm={searchTerm}
                            footerProps={{
                                total: users.length,
                                overallTotal: stats.total,
                                page: currentPage,
                                totalPages,
                                perPage: usersPerPage,
                                onPerPageChange: setUsersPerPage,
                                onPrev: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
                                onNext: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                            }}
                        />
                    </div>

                    {!isLoading && users.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                            <Users size={48} strokeWidth={1} />
                            <div className="text-center">
                                <p className="text-sm font-bold uppercase tracking-widest">No Clients Found</p>
                                <p className="text-[10px] font-mono mt-1">Try adjusting filters or add a new client</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={confirmAction}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                confirmVariant={dialogConfig.variant}
            />
        </div>
    );
};

export default UsersList;
