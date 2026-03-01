import React, { useState, useEffect } from 'react';
import { Search, Download, List, CheckCircle, XCircle, Users, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import SubscriptionTable from '../../components/tables/SubscriptionTable';
import Button from '../../components/ui/Button';
import { clsx } from 'clsx';
import ActiveSubscriptionsTable from '../../components/tables/ActiveSubscriptionsTable';
import { getAllSubscriptions } from '../../api/subscriptions.api';
import useToast from '../../hooks/useToast';

const Subscriptions = () => {
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
    const formatINR = (value) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
            .format(Number(value) || 0);

    const formatDate = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const normalizePlanType = (type) => {
        if (!type) return 'Unknown';
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };

    const normalizeStatus = (status) => {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const getMethodLabel = (sub) => {
        if (sub.transaction_id) return 'Manual';
        if (sub.payment_proof) return 'Proof';
        return '?';
    };

    const transactions = subscriptions.map(sub => ({
        id: sub.transaction_id || sub._id?.substring(0, 8).toUpperCase() || 'N/A',
        user: sub.user_id?.name || 'Unknown User',
        email: sub.user_id?.email || '',
        plan: normalizePlanType(sub.plan_type),
        amount: Number(sub.total_amount) || 0,
        amountDisplay: Number(sub.total_amount) ? formatINR(sub.total_amount) : '-',
        date: formatDate(sub.createdAt || sub.start_date),
        method: getMethodLabel(sub),
        status: normalizeStatus(sub.status),
        originalStatus: sub.status
    }));

// Prepare Data for Active Subscriptions Table
    const activeSubscriptions = subscriptions
        .filter(sub => sub.is_active || sub.status === 'active')
        .map(sub => {
            const start = new Date(sub.start_date);
            const end = new Date(sub.end_date);
            const totalDays = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
            const daysRemaining = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            return {
                userId: sub.user_id?._id?.substring(0, 6).toUpperCase() || 'N/A',
                user: sub.user_id?.name || 'Unknown',
                plan: normalizePlanType(sub.plan_type),
                startDate: formatDate(sub.start_date),
                expiryDate: formatDate(sub.end_date),
                totalDays,
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
                lastLoginIp: sub.user_id?.lastLoginIp
            };
        });

    const filteredTransactions = transactions.filter(txn =>
        (filter === 'All' || normalizeStatus(txn.originalStatus) === filter) &&
        (
            txn.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const filteredActiveSubs = activeSubscriptions.filter(sub =>
        sub.user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Dynamic Stats Calculation
    const totalRevenue = transactions
        .filter(t => t.originalStatus === 'active' || t.originalStatus === 'success')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const successCount = transactions.filter(t => t.originalStatus === 'active' || t.originalStatus === 'success').length;
    const pendingCount = transactions.filter(t => t.originalStatus === 'pending').length;
    const cancelledCount = transactions.filter(t => t.originalStatus === 'cancelled').length;

    const toneStyles = {
        emerald: {
            box: 'bg-emerald-500/10 border-emerald-500/20',
            text: 'text-emerald-500',
            bar: 'bg-emerald-500/70'
        },
        primary: {
            box: 'bg-primary/10 border-primary/20',
            text: 'text-primary',
            bar: 'bg-primary/70'
        },
        amber: {
            box: 'bg-amber-500/10 border-amber-500/20',
            text: 'text-amber-500',
            bar: 'bg-amber-500/70'
        },
        rose: {
            box: 'bg-rose-500/10 border-rose-500/20',
            text: 'text-rose-500',
            bar: 'bg-rose-500/70'
        },
        sky: {
            box: 'bg-sky-500/10 border-sky-500/20',
            text: 'text-sky-500',
            bar: 'bg-sky-500/70'
        }
    };

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
                {/* Top Stats */}
                <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-3 sm:p-4">
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                <Sparkles size={16} className="text-primary" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Overview</p>
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Subscription Intelligence</h2>
                            </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                            Updated: {formatDate(new Date().toISOString())}
                        </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
                        {[
                            { label: 'Total Revenue', value: formatINR(totalRevenue), icon: Wallet, tone: 'emerald' },
                            { label: 'Active', value: `${successCount}`, icon: CheckCircle, tone: 'primary' },
                            { label: 'Pending', value: `${pendingCount}`, icon: XCircle, tone: 'amber' },
                            { label: 'Cancelled', value: `${cancelledCount}`, icon: XCircle, tone: 'rose' },
                            { label: 'Active Members', value: `${activeSubscriptions.length}`, icon: Users, tone: 'sky' }
                        ].map((card) => {
                            const tone = toneStyles[card.tone] || toneStyles.primary;
                            return (
                                <div
                                    key={card.label}
                                    className="snap-start min-w-[220px] sm:min-w-[240px] flex-1 rounded-xl border border-border/70 bg-card/60 p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{card.label}</p>
                                            <p className="text-lg sm:text-xl font-bold text-foreground mt-1">{card.value}</p>
                                        </div>
                                        <div className={`h-9 w-9 rounded-xl border grid place-items-center ${tone.box}`}>
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
                        {/* Toolbar */
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                        <TrendingUp size={16} className="text-primary" />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Transactions</p>
                                        <h2 className="text-sm sm:text-base font-bold text-foreground">Subscription Database</h2>
                                    </div>
                                </div>

                                <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                                <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar">
                                    <span className="text-muted-foreground font-medium">Status:</span>
                                    {['All', 'Active', 'Pending', 'Cancelled'].map(f => (
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

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                                <div className="relative group w-full sm:w-64">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH TXN / USER / EMAIL..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-7 w-full text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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
                                    className="h-8 text-[11px] border-border gap-1.5 rounded-lg hover:border-primary/50 w-full sm:w-auto"
                                    onClick={() => handleExport(filteredTransactions, 'transactions.csv')}
                                >
                                    <Download size={12} /> Export
                                </Button>
                            </div>
                        </div>

                        /* Table */}
                        <div className="flex-1 min-h-0 relative">
                            <div className="min-h-[620px] md:min-h-[700px]">
                                <SubscriptionTable
                                    transactions={currentItemsForDisplay}
                                    highlightTerm={searchTerm}
                                    isLoading={isLoading}
                                    footerProps={{
                                        total: filteredTransactions.length,
                                        page: currentPage,
                                        totalPages: totalPages,
                                        perPage: itemsPerPage,
                                        onPerPageChange: setItemsPerPage,
                                        onPrev: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
                                        onNext: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
                                        rightExtra: (
                                            <div className="hidden md:flex items-center gap-2">
                                                <span>Active: <span className="text-emerald-500 font-bold">{successCount}</span></span>
                                                <span className="text-muted-foreground/40">|</span>
                                                <span>Revenue: <span className="text-emerald-500 font-bold">{formatINR(totalRevenue)}</span></span>
                                            </div>
                                        )
                                    }}
                                />
                            </div>

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

                    </div>
                )}

                {activeTab === 'active' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Active Toolbar */
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                        <CheckCircle size={16} className="text-primary" />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Active</p>
                                        <h2 className="text-sm sm:text-base font-bold text-foreground">Active Members</h2>
                                    </div>
                                </div>
                                <div className="hidden sm:block h-7 w-[1px] bg-border/70" />
                                <div className="text-xs text-muted-foreground">
                                    Total Active: <span className="text-foreground font-bold">{activeSubscriptions.length}</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                                <div className="relative group w-full sm:w-64">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="SEARCH USER..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-7 w-full text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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
                                    className="h-8 text-[11px] border-border gap-1.5 rounded-lg hover:border-primary/50 w-full sm:w-auto"
                                    onClick={() => handleExport(filteredActiveSubs, 'active_subscriptions.csv')}
                                >
                                    <Download size={12} /> Export List
                                </Button>
                            </div>
                        </div>

                        /* Active Table */}
                        <div className="flex-1 min-h-0 relative">
                            <div className="min-h-[620px] md:min-h-[700px]">
                                <ActiveSubscriptionsTable
                                    subscriptions={currentItems}
                                    highlightTerm={searchTerm}
                                    isLoading={isLoading}
                                    footerProps={{
                                        total: filteredActiveSubs.length,
                                        page: currentPage,
                                        totalPages: totalPages,
                                        perPage: itemsPerPage,
                                        onPerPageChange: setItemsPerPage,
                                        onPrev: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
                                        onNext: () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                    }}
                                />
                            </div>

                            {!isLoading && filteredActiveSubs.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                    <Users size={48} strokeWidth={1} />
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Active Subscriptions</p>
                                    </div>
                                </div>
                            )}
                        </div>


                    </div>
                )}
            </div>
        </div>
    );
};
export default Subscriptions;
