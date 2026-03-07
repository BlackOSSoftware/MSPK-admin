import React, { useEffect, useState } from 'react';
import { Search, Mail, Inbox, XCircle, Sparkles, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import TicketTable from '../../components/tables/TicketTable';
import TablePageFooter from '../../components/ui/TablePageFooter';
import { fetchEnquiries, updateEnquiryStatus } from '../../api/enquiries.api';

const normalizeStatus = (status) => (status || '').toString().trim().toLowerCase();

const AllEnquiries = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [enquiries, setEnquiries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        const loadEnquiries = async () => {
            setIsLoading(true);
            try {
                const { data } = await fetchEnquiries();
                setEnquiries(data);
            } catch (error) {
                console.error('Failed to load enquiries', error);
                toast.error('Failed to load enquiries');
            } finally {
                setIsLoading(false);
            }
        };

        loadEnquiries();
    }, []);

    const handleEnquiryAction = async (enquiry, action) => {
        const enquiryId = enquiry?._id;
        if (!enquiryId) return;

        const nextStatus = action === 'reject' ? 'rejected' : (action === 'pending' ? 'pending' : 'resolved');
        setActionLoadingId(enquiryId);

        try {
            await updateEnquiryStatus(enquiryId, nextStatus);
            setEnquiries((prev) =>
                prev.map((item) => (item._id === enquiryId ? { ...item, status: nextStatus } : item))
            );
            toast.success(`Enquiry ${nextStatus}`);
        } catch (error) {
            console.error(`Failed to ${nextStatus} enquiry`, error);
            toast.error(`Failed to ${nextStatus} enquiry`);
        } finally {
            setActionLoadingId('');
        }
    };

    const filteredEnquiries = enquiries
        .filter((enquiry) => {
            if (activeTab === 'pending') return normalizeStatus(enquiry.status) === 'pending';
            if (activeTab === 'resolved') return ['resolved', 'closed'].includes(normalizeStatus(enquiry.status));
            if (activeTab === 'rejected') return normalizeStatus(enquiry.status) === 'rejected';
            return true;
        })
        .filter((enquiry) => {
            const haystack = [
                enquiry.ticketId,
                enquiry.subject,
                enquiry.description,
                enquiry.ticketType,
                enquiry.contactName,
                enquiry.contactEmail,
                enquiry.contactNumber,
                enquiry.source,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(searchTerm.toLowerCase());
        });

    const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEnquiries = filteredEnquiries.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, itemsPerPage]);

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
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Web Enquiry Queue</h2>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        {[
                            { label: 'Total', value: `${enquiries.length}`, icon: Mail },
                            { label: 'Pending', value: `${enquiries.filter((item) => normalizeStatus(item.status) === 'pending').length}`, icon: AlertTriangle },
                            { label: 'Resolved', value: `${enquiries.filter((item) => ['resolved', 'closed'].includes(normalizeStatus(item.status))).length}`, icon: CheckCircle },
                            { label: 'Rejected', value: `${enquiries.filter((item) => normalizeStatus(item.status) === 'rejected').length}`, icon: TrendingUp },
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
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                <Mail size={16} className="text-primary" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Enquiries</p>
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Public Contact Requests</h2>
                            </div>
                        </div>

                        <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                        <div className="flex items-center gap-1 flex-wrap">
                            {[
                                ['all', `All (${enquiries.length})`, "bg-primary/20 text-primary border-primary/20"],
                                ['pending', `Pending (${enquiries.filter((item) => normalizeStatus(item.status) === 'pending').length})`, "bg-amber-500/20 text-amber-500 border-amber-500/20"],
                                ['resolved', `Resolved (${enquiries.filter((item) => ['resolved', 'closed'].includes(normalizeStatus(item.status))).length})`, "bg-emerald-500/20 text-emerald-500 border-emerald-500/20"],
                                ['rejected', `Rejected (${enquiries.filter((item) => normalizeStatus(item.status) === 'rejected').length})`, "bg-red-500/20 text-red-500 border-red-500/20"],
                            ].map(([value, label, activeTone]) => (
                                <button
                                    key={value}
                                    onClick={() => setActiveTab(value)}
                                    className={clsx(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all border",
                                        activeTab === value
                                            ? activeTone
                                            : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            type="text"
                            placeholder="SEARCH ENQUIRY..."
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
                </div>
            </div>

            <div className="flex-1 min-h-0 relative flex flex-col z-0">
                <div className="h-[720px] md:h-[800px] overflow-hidden">
                    <TicketTable
                        tickets={currentEnquiries}
                        isLoading={isLoading}
                        highlightTerm={searchTerm}
                        onAction={handleEnquiryAction}
                        actionLoadingId={actionLoadingId}
                    />
                </div>

                {!isLoading && filteredEnquiries.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                        <Inbox size={48} strokeWidth={1} />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">No Enquiries Found</p>
                            <p className="text-[10px] font-mono mt-1">Try adjusting filters</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2">
                <TablePageFooter
                    total={filteredEnquiries.length}
                    overallTotal={enquiries.length}
                    page={currentPage}
                    totalPages={totalPages}
                    perPage={itemsPerPage}
                    onPerPageChange={setItemsPerPage}
                    onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                />
            </div>
        </div>
    );
};

export default AllEnquiries;
