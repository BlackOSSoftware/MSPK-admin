import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Inbox, XCircle, Sparkles, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import TicketTable from '../../components/tables/TicketTable';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { fetchTickets, updateTicketStatus } from '../../api/tickets.api';
import TablePageFooter from '../../components/ui/TablePageFooter';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
// Removed useSelector and role checks as per request - pure Admin View

const AllTickets = () => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [activeTab, setActiveTab] = useState('all'); // Default to all
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [viewTicket, setViewTicket] = useState(null);

    // Pagination State (Standardized)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const normalizeStatus = (status) => (status || '').toString().trim().toLowerCase();

    // Sync Search with URL
    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    useEffect(() => {
        const loadTickets = async () => {
            setIsLoading(true);
            try {
                const { data } = await fetchTickets();
                setTickets(data);
            } catch (e) {
                console.error("Failed to load tickets", e);
                toast.error("Failed to load tickets");
            } finally {
                setIsLoading(false);
            }
        };
        loadTickets();
    }, []);

    const handleTicketAction = async (ticket, action) => {
        const ticketId = ticket?._id;
        if (!ticketId) return;

        const nextStatus = action === 'reject' ? 'rejected' : (action === 'pending' ? 'pending' : 'resolved');
        setActionLoadingId(ticketId);
        try {
            await updateTicketStatus(ticketId, nextStatus);
            setTickets(prev =>
                prev.map(t => (t._id === ticketId ? { ...t, status: nextStatus } : t))
            );
            toast.success(`Ticket ${nextStatus}`);
        } catch (error) {
            console.error(`Failed to ${nextStatus} ticket`, error);
            toast.error(`Failed to ${nextStatus} ticket`);
        } finally {
            setActionLoadingId('');
        }
    };

    const resolveTicketTitle = (ticket) => ticket?.subject || ticket?.ticketType || ticket?.category || 'Ticket';
    const resolveTicketMessage = (ticket) => ticket?.description || ticket?.message || ticket?.content || '-';
    const resolveTicketType = (ticket) => ticket?.ticketType || ticket?.category || '-';
    const resolveTicketEmail = (ticket) => ticket?.contactEmail || ticket?.user?.email || '-';
    const resolveTicketPhone = (ticket) => ticket?.contactNumber || ticket?.user?.phone || '-';
    const resolveTicketName = (ticket) => ticket?.contactName || ticket?.user?.name || '-';
    const resolveTicketSource = (ticket) => ticket?.source || '-';
    const resolveTicketStatus = (ticket) => ticket?.status || '-';
    const resolveTicketId = (ticket) => ticket?.ticketId || ticket?._id || '-';
    const resolveTicketDate = (ticket) => ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-';

    const getFilteredTickets = () => {
        let data = tickets;
        if (activeTab === 'open') data = data.filter(t => normalizeStatus(t.status) === 'open');
        if (activeTab === 'pending') data = data.filter(t => normalizeStatus(t.status) === 'pending');
        if (activeTab === 'resolved') data = data.filter(t => ['resolved', 'closed'].includes(normalizeStatus(t.status)));
        if (activeTab === 'rejected') data = data.filter(t => normalizeStatus(t.status) === 'rejected');

        return data.filter(t =>
            (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.ticketType && t.ticketType.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.contactName && t.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.contactEmail && t.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.contactNumber && t.contactNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.source && t.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.ticketId && t.ticketId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t._id && t._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.user && t.user.email && t.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.user && t.user.phone && t.user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.user && t.user.name && t.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const filteredTickets = getFilteredTickets();

    // Pagination Logic
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, itemsPerPage]);

    const handleExport = () => {
        if (!filteredTickets.length) {
            toast.error('No data to export');
            return;
        }
        setIsExporting(true);
        try {
            const exportData = filteredTickets.map((ticket) => ({
                id: ticket.ticketId || ticket._id || '',
                subject: ticket.subject || '',
                description: ticket.description || '',
                type: ticket.ticketType || ticket.category || '',
                status: ticket.status || '',
                source: ticket.source || '',
                name: ticket.contactName || ticket.user?.name || '',
                email: ticket.contactEmail || ticket.user?.email || '',
                phone: ticket.contactNumber || ticket.user?.phone || '',
                date: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '',
            }));

            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map((row) => headers.map((h) => JSON.stringify(row[h] || '')).join(',')),
            ].join('\n');

            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex flex-col gap-4 shrink-0">
                {/* Stats Header */}
                <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-3 sm:p-4">
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                <Sparkles size={16} className="text-primary" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Overview</p>
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Support Intelligence</h2>
                            </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                            Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        {[
                            { label: 'Total', value: `${tickets.length}`, icon: MessageSquare, tone: 'primary' },
                            { label: 'Open', value: `${tickets.filter(t => normalizeStatus(t.status) === 'open').length}`, icon: AlertTriangle, tone: 'rose' },
                            { label: 'Pending', value: `${tickets.filter(t => normalizeStatus(t.status) === 'pending').length}`, icon: TrendingUp, tone: 'amber' },
                            { label: 'Resolved', value: `${tickets.filter(t => ['resolved', 'closed'].includes(normalizeStatus(t.status))).length}`, icon: CheckCircle, tone: 'emerald' }
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="rounded-xl border border-border/70 bg-card/60 p-2.5 sm:p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{card.label}</p>
                                        <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">{card.value}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-lg border bg-primary/10 border-primary/20 grid place-items-center">
                                        <card.icon size={14} className="text-primary" />
                                    </div>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                                    <div className="h-full bg-primary/70" style={{ width: '70%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                <TrendingUp size={16} className="text-primary" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Tickets</p>
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Support Helpdesk</h2>
                            </div>
                        </div>

                        <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                        <div className="flex items-center gap-1 flex-wrap">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={clsx(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    activeTab === 'all'
                                        ? "bg-primary/20 text-primary border border-primary/20"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveTab('open')}
                                className={clsx(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    activeTab === 'open'
                                        ? "bg-red-500/20 text-red-500 border border-red-500/20"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                Open ({tickets.filter(t => normalizeStatus(t.status) === 'open').length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={clsx(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    activeTab === 'pending'
                                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/20"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                Pending ({tickets.filter(t => normalizeStatus(t.status) === 'pending').length})
                            </button>
                            <button
                                onClick={() => setActiveTab('resolved')}
                                className={clsx(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    activeTab === 'resolved'
                                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                Resolved ({tickets.filter(t => ['resolved', 'closed'].includes(normalizeStatus(t.status))).length})
                            </button>
                            <button
                                onClick={() => setActiveTab('rejected')}
                                className={clsx(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    activeTab === 'rejected'
                                        ? "bg-red-500/20 text-red-500 border border-red-500/20"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                Rejected ({tickets.filter(t => normalizeStatus(t.status) === 'rejected').length})
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto z-10">
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                type="text"
                                placeholder="SEARCH TICKET..."
                                className="bg-secondary/30 border border-white/5 h-8 pl-9 pr-7 w-full text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="h-8 px-3 rounded-lg border border-border/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/20 transition-all disabled:opacity-50"
                        >
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative flex flex-col z-0">
                <div className="h-[720px] md:h-[800px] overflow-hidden">
                    <TicketTable
                        tickets={currentTickets}
                        isLoading={isLoading}
                        highlightTerm={searchTerm}
                        onAction={handleTicketAction}
                        actionLoadingId={actionLoadingId}
                        onRowClick={setViewTicket}
                    />
                </div>

                {!isLoading && filteredTickets.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                        <Inbox size={48} strokeWidth={1} />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">No Tickets Found</p>
                            <p className="text-[10px] font-mono mt-1">Try adjusting filters</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2">
                <TablePageFooter
                    total={filteredTickets.length}
                    overallTotal={tickets.length}
                    page={currentPage}
                    totalPages={totalPages}
                    perPage={itemsPerPage}
                    onPerPageChange={setItemsPerPage}
                    onPrev={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    onNext={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                />
            </div>

            <ConfirmDialog
                isOpen={!!viewTicket}
                onClose={() => setViewTicket(null)}
                onConfirm={() => setViewTicket(null)}
                title={resolveTicketTitle(viewTicket)}
                message={[
                    `ID: ${resolveTicketId(viewTicket)}`,
                    `Name: ${resolveTicketName(viewTicket)}`,
                    `Email: ${resolveTicketEmail(viewTicket)}`,
                    `Phone: ${resolveTicketPhone(viewTicket)}`,
                    `Type: ${resolveTicketType(viewTicket)}`,
                    `Status: ${resolveTicketStatus(viewTicket)}`,
                    `Source: ${resolveTicketSource(viewTicket)}`,
                    `Date: ${resolveTicketDate(viewTicket)}`,
                    '',
                    'Description:',
                    resolveTicketMessage(viewTicket)
                ].join('\n')}
                confirmText="Close"
                confirmVariant="primary"
                hideCancel
            />
        </div>
    );
};

export default AllTickets;
