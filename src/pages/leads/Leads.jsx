import React, { useEffect, useState } from 'react';
import { Search, Filter, ShieldAlert, ChevronLeft, ChevronRight, RefreshCw, Eye, XCircle, Edit } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLeads, approveLead, deleteLead, updateLead } from '../../api/leads.api';
import LeadTable from '../../components/tables/LeadTable';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STATUS_OPTIONS = ['All', 'PENDING', 'CONVERTED', 'REJECTED'];

const Leads = () => {
    // State
    const [searchParams] = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('All');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Dialogs
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewImage, setViewImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    // Edit/Add Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLead, setEditLead] = useState(null);
    const [editData, setEditData] = useState({});
    const [isSavingLead, setIsSavingLead] = useState(false);

    const toast = useToast();

    // Sync Search with URL
    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    // Load Data
    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const data = await getLeads();
            setLeads(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load inquiries");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        const matchesStatus = filter === 'All' || lead.status === filter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
            (lead.mobile && lead.mobile.includes(searchLower)) ||
            (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
            (lead.city && lead.city.toLowerCase().includes(searchLower))
        );
        return matchesStatus && matchesSearch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirst, indexOfLast);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm, itemsPerPage]);

    // Handle Actions
    const handleAction = async (action, lead) => {
        if (action === 'viewImage') {
            const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/v1', '');
            setImageLoading(true);
            setViewImage(`${baseUrl}/${lead.paymentScreenshot}`);
        }
        else if (action === 'approve') {
            setPendingAction({ type: 'approve', lead });
            setDialogConfig({
                title: 'Approve Lead Access',
                message: `Are you sure you want to approve ${lead.name}? \n\nThis will automatically:\n• Create a User Account\n• Assign the '${lead.plan}' Subscription\n• Mark this inquiry as Approved.`,
                variant: 'primary',
                confirmText: 'Approve & Create User'
            });
            setDialogOpen(true);
        }
        else if (action === 'delete') {
            setPendingAction({ type: 'delete', lead });
            setDialogConfig({
                title: 'Delete Inquiry',
                message: `Are you sure you want to permanently delete the inquiry from ${lead.name}? This action cannot be undone.`,
                variant: 'danger',
                confirmText: 'Delete Permanently'
            });
            setDialogOpen(true);
        }
        else if (action === 'edit') {
            setEditLead(lead);
            setEditData({
                name: lead.name,
                email: lead.email,
                phone: lead.phone || lead.mobile,
                status: lead.status,
                notes: lead.notes || '',
                city: lead.city || '',
                plan: lead.plan || '',
                segment: lead.segment || ''
            });
            setIsEditModalOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'approve') {
                const { lead } = pendingAction;
                await approveLead(lead._id);
                // Optimistic Update
                setLeads(leads.map(l => l._id === lead._id ? { ...l, status: 'CONVERTED' } : l));
                toast.success(`User account created for ${lead.name}!`);
            }
            else if (pendingAction.type === 'delete') {
                const { lead } = pendingAction;
                await deleteLead(lead._id);
                setLeads(leads.filter(l => l._id !== lead._id));
                toast.success(`Inquiry from ${lead.name} deleted.`);
            }
            setDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Action failed");
            setDialogOpen(false);
        }
    };

    const handleSaveLead = async (e) => {
        e.preventDefault();
        if (!editLead) return;

        setIsSavingLead(true);
        try {
            // Update
            const updated = await updateLead(editLead._id, editData);
            setLeads(leads.map(l => l._id === editLead._id ? updated : l));
            toast.success("Inquiry updated successfully");
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save inquiry");
        } finally {
            setIsSavingLead(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-2">
            {/* Toolbar */}
            <div className="shrink-0 bg-card border border-white/5 p-3 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                {/* Left: Title & Filter */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 shrink-0">
                        <ShieldAlert size={16} className="text-primary" />
                        Inquiry Management
                    </h2>

                    <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 text-xs shrink-0 w-full sm:w-auto">
                        <span className="text-muted-foreground font-medium shrink-0">Status:</span>
                        <div className="w-full sm:w-32">
                            <SearchableSelect
                                options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                                value={filter}
                                onChange={setFilter}
                                placeholder="Filter Status"
                                searchable={false}
                                buttonClassName="py-1.5 text-[10px] rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Search & Refresh */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto z-10">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            type="text"
                            placeholder="SEARCH NAME"
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

                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 flex items-center justify-center rounded-lg"
                        onClick={fetchLeads}
                        title="Refresh Data"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 min-h-0 relative z-0 flex flex-col">
                <LeadTable leads={currentLeads} onAction={handleAction} isLoading={isLoading} highlightTerm={searchTerm} />

                {!isLoading && filteredLeads.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                        <ShieldAlert size={48} strokeWidth={1} />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">No Inquiries Found</p>
                            <p className="text-[10px] font-mono mt-1">Try adjusting filters</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Stats & Pagination */}
            <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                <div className="flex items-center gap-4">
                    <span>
                        {filteredLeads.length > 0 ? (
                            <>Showing <span className="text-foreground font-bold">{indexOfFirst + 1}-{Math.min(indexOfLast, filteredLeads.length)}</span> of <span className="text-foreground font-bold">{filteredLeads.length}</span></>
                        ) : (
                            <span className="text-muted-foreground">No records</span>
                        )}
                        <span className="text-muted-foreground/50 mx-2">|</span>
                        To Review: <span className="text-yellow-500 font-bold">{leads.filter(l => l.status === 'PENDING').length}</span>
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

            {/* Modals */}
            <ConfirmDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={confirmAction}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                confirmVariant={dialogConfig.variant}
            />

            {
                viewImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200" onClick={() => setViewImage(null)}>
                        <div className="max-w-3xl w-full bg-card rounded-xl overflow-hidden border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-white/5 bg-muted/20">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Payment Screenshot</h3>
                                <button onClick={() => setViewImage(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <div className="p-2 bg-black/50 flex justify-center relative min-h-[300px]">
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                )}
                                <img
                                    src={viewImage}
                                    alt="Payment Proof"
                                    onLoad={() => setImageLoading(false)}
                                    className={`max-h-[70vh] w-auto h-auto rounded shadow-lg object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                />
                            </div>
                            <div className="p-4 flex justify-end bg-muted/20 border-t border-white/5">
                                <Button onClick={() => setViewImage(null)} variant="secondary" size="sm">Close Viewer</Button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-card w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-white/5 bg-muted/20 flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <Edit size={16} className="text-primary" />
                                    Edit Inquiry
                                </h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveLead} className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={editData.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-2 text-xs focus:border-primary/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={editData.email}
                                            onChange={e => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-2 text-xs focus:border-primary/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone / Mobile</label>
                                        <input
                                            type="text"
                                            required
                                            value={editData.phone}
                                            onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                            className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-2 text-xs focus:border-primary/50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">City</label>
                                        <input
                                            type="text"
                                            value={editData.city}
                                            onChange={e => setEditData({ ...editData, city: e.target.value })}
                                            className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-2 text-xs focus:border-primary/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Segment</label>
                                        <select
                                            value={editData.segment}
                                            onChange={e => setEditData({ ...editData, segment: e.target.value })}
                                            className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-1.5 text-xs focus:border-primary/50 outline-none"
                                        >
                                            <option value="EQUITY_INTRA">Equity Intra</option>
                                            <option value="NIFTY_OPT">Nifty Option</option>
                                            <option value="BANKNIFTY_OPT">BankNifty</option>
                                            <option value="MCX_FUT">MCX/Commodity</option>
                                            <option value="CRYPTO">Crypto</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Plan</label>
                                        <input
                                            type="text"
                                            value={editData.plan}
                                            onChange={e => setEditData({ ...editData, plan: e.target.value })}
                                            className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-2 text-xs focus:border-primary/50 outline-none"
                                            placeholder="Demo / Basic / Pro"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                                    <textarea
                                        value={editData.notes}
                                        onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full bg-secondary/30 border border-border/70 rounded px-3 py-2 text-xs focus:border-primary/50 outline-none resize-none"
                                        placeholder="Conversation notes..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" size="sm" disabled={isSavingLead}>
                                        {isSavingLead ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default Leads;
