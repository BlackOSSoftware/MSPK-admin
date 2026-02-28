import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, ShieldAlert, ChevronLeft, ChevronRight, Briefcase, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BrokerTable from '../../components/tables/BrokerTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { fetchSubBrokers, deleteSubBroker, updateSubBroker } from '../../api/subbrokers.api';

const STATUS_OPTIONS = ['All', 'Active', 'Blocked', 'Inactive'];

const AllBrokers = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [brokers, setBrokers] = useState([]);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('All');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const toast = useToast();

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    const loadBrokers = async () => {
        setIsLoading(true);
        try {
            const { data } = await fetchSubBrokers();
            setBrokers(data);
        } catch (e) {
            console.error("Failed to load brokers", e);
            toast.error("Failed to load brokers");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    useEffect(() => {
        loadBrokers();
    }, []);

    const handleAction = (action, broker) => {
        if (action === 'view') {
            navigate(`/brokers/details?id=${broker.id}`);
        } else if (action === 'edit') {
            navigate(`/brokers/edit?id=${broker.id}`);
        } else if (action === 'delete') {
            setDialogConfig({
                isOpen: true,
                title: 'Delete Partner',
                message: `Are you sure you want to delete ${broker.name}? This action cannot be undone.`,
                variant: 'danger',
                confirmText: 'Delete'
            });
            setPendingAction({ type: 'delete', data: broker });
            setDialogOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;
        try {
            if (pendingAction.type === 'delete') {
                await deleteSubBroker(pendingAction.data.id);
                toast.success('Partner deleted successfully');
                loadBrokers();
            }
        } catch (error) {
            console.error(error);
            toast.error('Action failed');
        } finally {
            setDialogOpen(false);
            setPendingAction(null);
        }
    };

    // Filter Logic
    const filteredBrokers = brokers.filter(broker =>
        (filter === 'All' || (broker.status || 'Active') === filter) &&
        (broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (broker.brokerId && broker.brokerId.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredBrokers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBrokers = filteredBrokers.slice(indexOfFirstItem, indexOfLastItem);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm, itemsPerPage]);

    // Export to CSV
    const handleExport = () => {
        if (!brokers || brokers.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Broker ID", "Name", "Location", "Clients", "Commission Type", "Commission Value", "Total Revenue", "Status", "Joined Date"];
        const csvContent = [
            headers.join(","),
            ...brokers.map(b => [
                b.brokerId || b.id,
                `"${b.name}"`, // Quote name to handle commas
                `"${b.location || ''}"`,
                b.totalClients || 0,
                b.commission?.type || '',
                b.commission?.value || 0,
                b.totalRevenue || 0,
                b.status,
                new Date(b.createdAt).toLocaleDateString()
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `partners_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Partners exported successfully");
    };

    return (
        <div className="h-full flex flex-col gap-2">
            {/* Toolbar - Aligned with AllUsers */}
            <div className="shrink-0 bg-card border border-white/5 p-3 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                {/* Left Section: Title & Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 shrink-0">
                        <Briefcase size={16} className="text-primary" />
                        Partner Brokers
                    </h2>

                    <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

                    {/* Filters Wrapper */}
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto relative z-20">
                        {/* Status Filter */}
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
                            placeholder="SEARCH BROKER..."
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
                        <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-[11px] hidden md:flex">
                            Export
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/brokers/add')}
                            className="h-8 flex-1 md:flex-none text-[11px] gap-1.5 rounded-lg font-bold shadow-lg shadow-primary/20 justify-center"
                        >
                            <Plus size={12} /> Onboard Broker
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="flex-1 min-h-0 relative z-0 flex flex-col">
                <BrokerTable brokers={currentBrokers} onAction={handleAction} isLoading={isLoading} highlightTerm={searchTerm} />

                {!isLoading && filteredBrokers.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                        <Briefcase size={48} strokeWidth={1} />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">No Partners Found</p>
                            <p className="text-[10px] font-mono mt-1">Try adjusting filters or onboard a new partner</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Stats & Pagination */}
            <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                <div className="flex items-center gap-4">
                    <span>
                        {filteredBrokers.length > 0 ? (
                            <>Showing <span className="text-foreground font-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBrokers.length)}</span> of <span className="text-foreground font-bold">{filteredBrokers.length}</span></>
                        ) : (
                            <span className="text-muted-foreground">No partners found</span>
                        )}
                        <span className="text-muted-foreground/50 mx-2">|</span>
                        Total: <span className="text-foreground font-bold">{brokers.length}</span>
                    </span>
                    <div className="ml-4 flex items-center gap-2">
                        <span>Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-card text-foreground font-bold border-b border-border focus:outline-none focus:border-primary cursor-pointer pb-0.5 rounded px-1"
                        >
                            <option value={10} className="bg-card text-foreground">10</option>
                            <option value={20} className="bg-card text-foreground">20</option>
                            <option value={50} className="bg-card text-foreground">50</option>
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

                    <div className="h-4 w-[1px] bg-white/10 mx-2"></div>

                    <span>Active: <span className="text-emerald-500 font-bold">{brokers.filter(b => b.status === 'Active').length}</span></span>

                    <div className="h-4 w-[1px] bg-white/10 mx-2"></div>

                    <span>Total Revenue: <span className="text-emerald-500 font-bold">₹ {brokers.reduce((sum, b) => sum + (b.totalRevenue || 0), 0).toLocaleString()}</span></span>
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

export default AllBrokers;
