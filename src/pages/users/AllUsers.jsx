import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, ShieldAlert, Users, Activity, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserTable from '../../components/tables/UserTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STATUS_OPTIONS = ['All', 'Active', 'Liquidated', 'Blocked'];

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
        else if (action === 'liquidate') {
            setPendingAction({ type: 'liquidate', user });
            setDialogConfig({
                title: 'Liquidate Positions',
                message: `Are you sure you want to LIQUIDATE all positions for ${user.clientId}? This will reset their positions and mark them as Liquidated.`,
                variant: 'danger',
                confirmText: 'Liquidate'
            });
            setDialogOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            const { deleteUser, blockUser, liquidateUser } = await import('../../api/users.api');
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
            } else if (type === 'liquidate') {
                await liquidateUser(user.id);
                setUsers(users.map(u => u.id === user.id ? {
                    ...u,
                    status: 'Liquidated',
                    marginUsed: 0,
                    pnl: 0
                } : u));
                toast.success(`Positions liquidated for ${user.clientId}`);
            }

            setDialogOpen(false);
        } catch (error) {
            console.error("Action failed", error);
            const msg = error.response?.data?.message || error.message;
            toast.error(`Action failed: ${msg}`);
            setDialogOpen(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesStatus = filter === 'All' || user.status === filter;

        // Handle Broker Filter
        let matchesSubBroker = true;
        if (subBrokerFilter !== 'All') {
            if (subBrokerFilter === 'DIRECT') {
                // Backend returns 'DIRECT' for users without sub-broker
                matchesSubBroker = user.subBrokerId === 'DIRECT' || !user.subBrokerId;
            } else {
                // Check if subBrokerId matches the selected ID
                // user.subBrokerId might be an object (populated) or string
                const userSbId = user.subBrokerId && typeof user.subBrokerId === 'object' ? user.subBrokerId._id || user.subBrokerId.id : user.subBrokerId;
                matchesSubBroker = userSbId === subBrokerFilter;
            }
        }

        const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.clientId && user.clientId.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSubBroker && matchesSearch;
    });

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
        <div className="h-full flex flex-col gap-2">
            {/* Toolbar - Simple & Clean */}
            <div className="shrink-0 bg-card border border-white/5 p-3 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                {/* Left Section: Title & Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 shrink-0">
                        <ShieldAlert size={16} className="text-primary" />
                        Client Database
                    </h2>

                    <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

                    {/* Filters Wrapper */}
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto relative z-20">

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center gap-2 text-xs shrink-0 w-full sm:w-auto">
                            <span className="text-muted-foreground font-medium shrink-0">Status:</span>
                            <div className="w-full sm:w-28">
                                <SearchableSelect
                                    options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                                    value={filter}
                                    onChange={setFilter}
                                    placeholder="Select Status"
                                    searchable={false}
                                    buttonClassName="py-1.5 text-[10px] rounded"
                                />
                            </div>
                        </div>

                        <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

                        {/* Broker Filter Dropdown (Searchable) */}
                        <div className="flex items-center gap-2 text-xs shrink-0 w-full md:w-auto">
                            <span className="text-muted-foreground font-medium shrink-0">Broker:</span>
                            <div className="w-full sm:w-48">
                                <SearchableSelect
                                    options={subBrokers}
                                    value={subBrokerFilter}
                                    onChange={setSubBrokerFilter}
                                    placeholder="Filter by Broker..."
                                    searchPlaceholder="Search Broker..."
                                    buttonClassName="py-1.5 text-[10px] rounded"
                                    dropdownClassName="min-w-[200px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Search & Actions */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto z-10">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            type="text"
                            placeholder="SEARCH CLIENT ID..."
                            className="bg-secondary/30 border border-white/5 h-8 pl-9 pr-7 w-full md:w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/users/create')}
                            className="h-8 flex-1 md:flex-none text-[11px] gap-1.5 rounded-lg font-bold shadow-lg shadow-primary/20 justify-center"
                        >
                            <Plus size={12} /> New Client
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="flex-1 min-h-0 relative z-0 flex flex-col">
                <UserTable users={currentUsers} onAction={handleAction} isLoading={isLoading} highlightTerm={searchTerm} />

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

            {/* Footer Stats & Pagination */}
            <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                <div className="flex items-center gap-4">
                    <span>
                        {filteredUsers.length > 0 ? (
                            <>Showing <span className="text-foreground font-bold">{indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="text-foreground font-bold">{filteredUsers.length}</span></>
                        ) : (
                            <span className="text-muted-foreground">No users found</span>
                        )}
                        <span className="text-muted-foreground/50 mx-2">|</span>
                        Total: <span className="text-foreground font-bold">{users.length}</span>
                    </span>
                    <div className="ml-4 flex items-center gap-2">
                        <span>Show:</span>
                        <select
                            value={usersPerPage}
                            onChange={(e) => setUsersPerPage(Number(e.target.value))}
                            className="bg-card text-foreground font-bold border-b border-border focus:outline-none focus:border-primary cursor-pointer pb-0.5 rounded px-1"
                        >
                            <option value={10} className="bg-card text-foreground">10</option>
                            <option value={20} className="bg-card text-foreground">20</option>
                            <option value={50} className="bg-card text-foreground">50</option>
                            <option value={100} className="bg-card text-foreground">100</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                        <span className="mr-2">Page {currentPage} of {totalPages || 1}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

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
