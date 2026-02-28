import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageSquare, Download, Filter, Inbox, CheckCircle, AlertCircle, Trash2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TicketTable from '../../components/tables/TicketTable';
import Button from '../../components/ui/Button';
import { clsx } from 'clsx';
// Removed useSelector and role checks as per request - pure Admin View

const AllTickets = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [activeTab, setActiveTab] = useState('all'); // Default to all
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination State (Standardized)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Sync Search with URL
    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    useEffect(() => {
        const loadTickets = async () => {
            setIsLoading(true);
            try {
                const { fetchTickets } = await import('../../api/tickets.api');
                const { data } = await fetchTickets();
                setTickets(data);
            } catch (e) {
                console.error("Failed to load tickets", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadTickets();
    }, []);

    const getFilteredTickets = () => {
        let data = tickets;
        if (activeTab === 'open') data = data.filter(t => t.status === 'Open' || t.status === 'OPEN');
        if (activeTab === 'resolved') data = data.filter(t => t.status === 'Resolved' || t.status === 'RESOLVED' || t.status === 'CLOSED');

        return data.filter(t =>
            (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.ticketId && t.ticketId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t._id && t._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

    return (
        <div className="h-full flex flex-col gap-2">
            {/* Toolbar - Simple & Clean (Matching AllUsers.jsx style) */}
            <div className="shrink-0 bg-card border border-white/5 p-3 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section: Title & Tabs */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 shrink-0">
                        <MessageSquare size={16} className="text-primary" />
                        Support Helpdesk
                    </h2>

                    <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

                    {/* Tab Filters */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={clsx(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                activeTab === 'all'
                                    ? "bg-primary/20 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            All Tickets
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
                            Open ({tickets.filter(t => t.status === 'OPEN' || t.status === 'Open').length})
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
                            Resolved
                        </button>
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
                            placeholder="SEARCH TICKET..."
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
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative flex flex-col z-0">
                <TicketTable tickets={currentTickets} isLoading={isLoading} highlightTerm={searchTerm} />

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

            {/* Footer Stats & Pagination (Matching AllUsers.jsx) */}
            <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                <div className="flex items-center gap-4">
                    <span>
                        {filteredTickets.length > 0 ? (
                            <>Showing <span className="text-foreground font-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTickets.length)}</span> of <span className="text-foreground font-bold">{filteredTickets.length}</span></>
                        ) : (
                            <span className="text-muted-foreground">No tickets found</span>
                        )}
                        <span className="text-muted-foreground/50 mx-2">|</span>
                        Total: <span className="text-foreground font-bold">{tickets.length}</span>
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
        </div>
    );
};

export default AllTickets;
