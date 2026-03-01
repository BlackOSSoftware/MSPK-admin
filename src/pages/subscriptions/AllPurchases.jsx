import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, Download, List, CheckCircle, XCircle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SubscriptionTable from '../../components/tables/SubscriptionTable';
import Button from '../../components/ui/Button';
import { clsx } from 'clsx';
import ActiveSubscriptionsTable from '../../components/tables/ActiveSubscriptionsTable';
import { getAllSubscriptions } from '../../api/subscriptions.api';
import useToast from '../../hooks/useToast';

const Subscriptions = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('history'); // history, active
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    // Reset pagination when filter/search/tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm, activeTab, itemsPerPage]);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const { data } = await getAllSubscriptions();
            setSubscriptions(data);
        } catch (error) {
            console.error("Failed to fetch subscriptions", error);
            toast.error("Failed to load subscription data");
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare Data for Transactions Table
    const transactions = subscriptions.map(sub => ({
        id: sub.transaction?.transactionId || sub._id.substring(0, 8).toUpperCase(),
        user: sub.user?.name || 'Unknown User',
        plan: sub.plan?.name || 'Unknown Plan',
        amount: sub.transaction?.amount || 0, // Store as number for calculation
        amountDisplay: sub.transaction?.amount ? `₹${sub.transaction.amount}` : '-',
        date: new Date(sub.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        method: sub.transaction?.paymentGateway || 'Unknown',
        status: sub.transaction?.status === 'success' ? 'Success' : (sub.transaction?.status === 'failed' ? 'Failed' : 'Pending'),
        originalStatus: sub.transaction?.status // for filtering
    }));

    // Prepare Data for Active Subscriptions Table
    const activeSubscriptions = subscriptions
        .filter(sub => sub.status === 'active')
        .map(sub => {
            const daysRemaining = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            return {
                userId: sub.user?._id?.substring(0, 6).toUpperCase() || 'N/A', // Using stub ID if no custom ID
                user: sub.user?.name || 'Unknown',
                plan: sub.plan?.name || 'Unknown Plan',
                startDate: new Date(sub.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                expiryDate: new Date(sub.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
                lastLoginIp: sub.user?.lastLoginIp
            };
        });

    const filteredTransactions = transactions.filter(txn =>
        (filter === 'All' || (txn.originalStatus === 'success' && filter === 'Success') || (txn.originalStatus === 'failed' && filter === 'Failed')) &&
        (txn.user.toLowerCase().includes(searchTerm.toLowerCase()) || txn.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredActiveSubs = activeSubscriptions.filter(sub =>
        sub.user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Dynamic Stats Calculation
    const totalRevenue = transactions
        .filter(t => t.originalStatus === 'success')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const successCount = transactions.filter(t => t.originalStatus === 'success').length;

    // Pagination Logic
    const currentDataList = activeTab === 'history' ? filteredTransactions : filteredActiveSubs;
    const totalPages = Math.ceil(currentDataList.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = currentDataList.slice(indexOfFirstItem, indexOfLastItem);

    // Fix Amount display for table (it expects 'amount' to be the display string in previous logic, but we changed it to number. 
    // Let's map it back for the table view or adjust table. 
    // Actually, looking at SubscriptionTable.jsx (viewed previously), it uses `txn.amount`. 
    // I changed `amount` to number and added `amountDisplay`. I should map `amount` back to display string for the table VIEW, 
    // or better, providing a view-specific object.
    // Let's create a display-ready list for the table.
    const currentItemsForDisplay = currentItems.map(item => ({
        ...item,
        amount: item.amountDisplay || item.amount // Fallback
    }));

    const handleExport = (data, filename) => {
        if (!data || data.length === 0) {
            toast.error("No data to export");
            return;
        }

        // For export, we might want the cleaning of data (e.g. number amount vs string)
        // Using the raw data (with amount as number) might be better, or strict display. 
        // Let's use the display version for consistency with view.
        const exportData = data.map(item => ({
            ...item,
            amount: item.amountDisplay || item.amount
        }));

        const headers = Object.keys(exportData[0]).filter(k => k !== 'originalStatus' && k !== 'amountDisplay');
        // Filter out internal fields

        const csvContent = [
            headers.join(','),
            ...exportData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'history'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <List size={14} /> Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'active'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <CheckCircle size={14} /> Active Subscriptions
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative flex flex-col">
                {activeTab === 'history' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <RefreshCcw size={16} className="text-primary" />
                                    Subscription Database
                                </h2>

                                <div className="h-6 w-[1px] bg-border"></div>

                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground font-medium">Status:</span>
                                    {['All', 'Success', 'Failed'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all uppercase tracking-wide ${filter === f ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]' : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH TXN OR USER..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-7 w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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
                                    className="h-8 text-[11px] border-border gap-1.5 rounded-lg hover:border-primary/50"
                                    onClick={() => handleExport(filteredTransactions, 'transactions.csv')}
                                >
                                    <Download size={12} /> Export
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 min-h-0 relative">
                            <SubscriptionTable transactions={currentItemsForDisplay} highlightTerm={searchTerm} isLoading={isLoading} />

                            {!isLoading && filteredTransactions.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                    <List size={48} strokeWidth={1} />
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Transactions Found</p>
                                        <p className="text-[10px] font-mono mt-1">Try adjusting filters</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Stats & Pagination */}
                        <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            <div className="flex items-center gap-4">
                                <span>
                                    {filteredTransactions.length > 0 ? (
                                        <>Showing <span className="text-foreground font-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)}</span> of <span className="text-foreground font-bold">{filteredTransactions.length}</span></>
                                    ) : (
                                        <span className="text-muted-foreground">No records found</span>
                                    )}
                                </span>
                                <span className="text-muted-foreground/50">|</span>
                                <div className="flex items-center gap-2">
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
                                        className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="h-4 w-[1px] bg-border mx-2"></div>

                                <span>Successful: <span className="text-emerald-500 font-bold">{successCount}</span></span>
                                <span className="text-muted-foreground/50 mx-1">|</span>
                                <span>Revenue: <span className="text-emerald-500 font-bold">₹{totalRevenue.toLocaleString()}</span></span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'active' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Active Toolbar */}
                        <div className="flex items-center justify-between shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <CheckCircle size={16} className="text-primary" />
                                    Active Members
                                </h2>
                                <div className="h-6 w-[1px] bg-border"></div>
                                <div className="text-xs text-muted-foreground">
                                    Total Active: <span className="text-foreground font-bold">{activeSubscriptions.length}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="SEARCH USER..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-7 w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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
                                    className="h-8 text-[11px] border-border gap-1.5 rounded-lg hover:border-primary/50"
                                    onClick={() => handleExport(filteredActiveSubs, 'active_subscriptions.csv')}
                                >
                                    <Download size={12} /> Export List
                                </Button>
                            </div>
                        </div>

                        {/* Active Table */}
                        <div className="flex-1 min-h-0 relative">
                            <ActiveSubscriptionsTable subscriptions={currentItems} highlightTerm={searchTerm} isLoading={isLoading} />

                            {!isLoading && filteredActiveSubs.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                    <Users size={48} strokeWidth={1} />
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Active Subscriptions</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active Footer Pagination */}
                        <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            <div className="flex items-center gap-4">
                                <span>
                                    {filteredActiveSubs.length > 0 ? (
                                        <>Showing <span className="text-foreground font-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredActiveSubs.length)}</span> of <span className="text-foreground font-bold">{filteredActiveSubs.length}</span></>
                                    ) : (
                                        <span className="text-muted-foreground">No records found</span>
                                    )}
                                </span>
                                <span className="text-muted-foreground/50">|</span>
                                <div className="flex items-center gap-2">
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
                                        className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Subscriptions;
