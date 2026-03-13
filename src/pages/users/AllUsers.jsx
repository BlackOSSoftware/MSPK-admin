import React, { useEffect, useState } from 'react';
import { Search, Plus, Users, Activity, XCircle, Sparkles, TrendingUp, CheckCircle, UserCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserTable from '../../components/tables/UserTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STATUS_OPTIONS = ['All', 'Active', 'Blocked'];

const UsersList = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [subBrokers, setSubBrokers] = useState([{ value: 'All', label: 'All Brokers' }, { value: 'DIRECT', label: 'Direct Clients' }]);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // Sync Search with URL
    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    const [filter, setFilter] = useState('All');
    const [subBrokerFilter, setSubBrokerFilter] = useState('All');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(20);

    const toast = useToast();

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const { fetchUsers } = await import('../../api/users.api');
                const { fetchSubBrokers } = await import('../../api/subbrokers.api');

                const [usersRes, sbRes] = await Promise.all([
                    fetchUsers(),
                    fetchSubBrokers()
                ]);

                setUsers(usersRes.data);

                // Format SubBrokers for SearchableSelect
                const sbOptions = sbRes.data.map(sb => ({
                    value: sb.id,
                    label: `${sb.name} (${sb.clientId})`
                }));
                setSubBrokers([
                    { value: 'All', label: 'All Brokers' },
                    { value: 'DIRECT', label: 'Direct Clients' },
                    ...sbOptions
                ]);

            } catch (e) {
                console.error("Failed to load users data", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleAction = async (action, user) => {
        if (action === 'view') {
            navigate(`/users/details?id=${user.id}`);
        }
        else if (action === 'edit') {
            navigate(`/users/edit?id=${user.id}`);
        }
        else if (action === 'delete') {
            setPendingAction({ type: 'delete', user });
            setDialogConfig({
                title: 'Delete Client',
                message: `Are you sure you want to PERMANENTLY DELETE ${user.name}? This action cannot be undone and will remove all subscription data.`,
                variant: 'danger',
                confirmText: 'Delete Client'
            });
            setDialogOpen(true);
        }
        else if (action === 'block') {
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
                setUsers(users.filter(u => u.id !== user.id));
                toast.success(`Client ${user.name} deleted successfully`);
            } else if (type === 'block') {
                const res = await blockUser(user.id);
                const newStatus = res.data.status;
                setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                toast.success(`Client stats updated for ${user.name}`);
            }

            setDialogOpen(false);
        } catch (error) {
            console.error("Action failed", error);
            const msg = error.response?.data?.message || error.message;
            toast.error(`Action failed: ${msg}`);
            setDialogOpen(false);
        }
    };

    const getSubBrokerId = (user) =>
        user.subBrokerId && typeof user.subBrokerId === 'object'
            ? user.subBrokerId._id || user.subBrokerId.id
            : user.subBrokerId;

    const filteredUsers = users.filter(user => {
        const matchesStatus = filter === 'All' || user.status === filter;

        // Handle Broker Filter
        let matchesSubBroker = true;
        if (subBrokerFilter !== 'All') {
            if (subBrokerFilter === 'DIRECT') {
                // Backend returns 'DIRECT' for users without sub-broker
                const userSbId = getSubBrokerId(user);
                matchesSubBroker = userSbId === 'DIRECT' || !userSbId;
            } else {
                // Check if subBrokerId matches the selected ID
                // user.subBrokerId might be an object (populated) or string
                const userSbId = getSubBrokerId(user);
                matchesSubBroker = userSbId === subBrokerFilter;
            }
        }

        const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.clientId && user.clientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSubBroker && matchesSearch;
    });

    const totalUsers = users.length;
    const activeCount = users.filter(u => u.status === 'Active').length;
    const blockedCount = users.filter(u => u.status === 'Blocked').length;
    const directCount = users.filter(u => {
        const sbId = getSubBrokerId(u);
        return !sbId || sbId === 'DIRECT';
    }).length;
    const brokerCount = totalUsers - directCount;

    const toneStyles = {
        emerald: { box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', bar: 'bg-emerald-500/70' },
        primary: { box: 'bg-primary/10 border-primary/20', text: 'text-primary', bar: 'bg-primary/70' },
        amber: { box: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', bar: 'bg-amber-500/70' },
        rose: { box: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-500', bar: 'bg-rose-500/70' },
        sky: { box: 'bg-sky-500/10 border-sky-500/20', text: 'text-sky-500', bar: 'bg-sky-500/70' }
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, subBrokerFilter, searchTerm, usersPerPage]);

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex flex-col gap-4 shrink-0">
                <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-3 sm:p-4">
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                <Sparkles size={16} className="text-primary" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Overview</p>
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Client Intelligence</h2>
                            </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                            Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                        {[
                            { label: 'Total Clients', value: `${totalUsers}`, icon: Users, tone: 'primary' },
                            { label: 'Active', value: `${activeCount}`, icon: CheckCircle, tone: 'emerald' },
                            { label: 'Blocked', value: `${blockedCount}`, icon: XCircle, tone: 'rose' },
                            { label: 'Direct', value: `${directCount}`, icon: UserCheck, tone: 'sky' },
                            { label: 'Brokered', value: `${brokerCount}`, icon: Activity, tone: 'amber' }
                        ].map((card) => {
                            const tone = toneStyles[card.tone] || toneStyles.primary;
                            return (
                                <div
                                    key={card.label}
                                    className="rounded-xl border border-border/70 bg-card/60 p-2.5 sm:p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{card.label}</p>
                                            <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">{card.value}</p>
                                        </div>
                                        <div className={`h-8 w-8 rounded-lg border grid place-items-center ${tone.box}`}>
                                            <card.icon size={14} className={tone.text} />
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

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                <TrendingUp size={16} className="text-primary" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Clients</p>
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Client Database</h2>
                            </div>
                        </div>

                        <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                        <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar">
                            <span className="text-muted-foreground font-medium">Status:</span>
                            {STATUS_OPTIONS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all uppercase tracking-wide ${filter === f ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]' : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                        <div className="flex items-center gap-2 text-xs shrink-0">
                            <span className="text-muted-foreground font-medium shrink-0">Broker:</span>
                            <div className="min-w-[210px]">
                                <SearchableSelect
                                    options={subBrokers}
                                    value={subBrokerFilter}
                                    onChange={setSubBrokerFilter}
                                    placeholder="Filter by Broker..."
                                    searchPlaceholder="Search Broker..."
                                    buttonClassName="py-1.5 text-[10px] rounded bg-secondary/40 border border-white/5 hover:border-primary/40 transition-all"
                                    dropdownClassName="min-w-[200px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                type="text"
                                placeholder="SEARCH USER / CLIENT ID / EMAIL..."
                                className="bg-secondary/30 border border-white/5 h-8 pl-9 pr-7 w-full text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/60 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <XCircle size={12} className="opacity-50 hover:opacity-100" />
                                </button>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/users/create')}
                            className="h-8 w-full sm:w-auto text-[11px] gap-1.5 rounded-lg font-bold justify-center btn-cancel"
                        >
                            <Plus size={12} /> New Client
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative flex flex-col">
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="min-h-[620px] md:min-h-[700px]">
                        <UserTable
                            users={currentUsers}
                            onAction={handleAction}
                            isLoading={isLoading}
                            highlightTerm={searchTerm}
                            footerProps={{
                                total: filteredUsers.length,
                                overallTotal: users.length,
                                page: currentPage,
                                totalPages,
                                perPage: usersPerPage,
                                onPerPageChange: setUsersPerPage,
                                onPrev: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
                                onNext: () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
                            }}
                        />
                    </div>

                    {!isLoading && filteredUsers.length === 0 && (
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
;
};

export default UsersList;
