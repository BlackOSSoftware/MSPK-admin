import React, { useState, useEffect } from 'react';
import { Search, Plus, CreditCard, Clock, List, ChevronLeft, ChevronRight, XCircle, Check, Edit, Trash2, Star, Radio } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import PlanValiditySettings from './PlanValiditySettings';
import { clsx } from 'clsx';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const formatINR = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
        .format(Number(value) || 0);

const formatValidity = (days) => {
    const d = Number(days) || 0;
    if (d <= 0) return '';
    if (d >= 360) {
        const years = Math.round(d / 365);
        return years === 1 ? '1 Year' : `${years} Years`;
    }
    if (d >= 28 && d <= 31) return 'Monthly';
    if (d % 30 === 0) {
        const months = d / 30;
        return months === 1 ? '1 Month' : `${months} Months`;
    }
    if (d % 7 === 0) {
        const weeks = d / 7;
        return weeks === 1 ? '1 Week' : `${weeks} Weeks`;
    }
    return `${d} Days`;
};

const PlanCardSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-border bg-card/60 overflow-hidden">
        <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-muted/50 rounded" />
                    <div className="h-3 w-48 bg-muted/40 rounded" />
                </div>
                <div className="h-6 w-16 bg-muted/40 rounded" />
            </div>
            <div className="h-8 w-28 bg-muted/50 rounded" />
            <div className="space-y-2">
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-11/12 bg-muted/30 rounded" />
                <div className="h-3 w-10/12 bg-muted/30 rounded" />
            </div>
            <div className="h-9 w-full bg-muted/40 rounded-lg" />
        </div>
    </div>
);

const PlanCard = ({ plan, isPopular, onEdit, onDelete }) => {
    const features = Array.isArray(plan?.features) ? plan.features : [];
    const shownFeatures = features.slice(0, 6);
    const remaining = features.length - shownFeatures.length;

    const planType = plan?.isDemo ? 'Demo' : 'Premium';
    const validityLabel = formatValidity(plan?.durationDays);
    const priceLabel = plan?.isDemo ? 'Free' : formatINR(plan?.price);

    return (
        <div
            className={clsx(
                "relative rounded-2xl border bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 group",
                isPopular ? "border-primary/50" : "border-border/60",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/10"
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none opacity-50 transition-opacity duration-300 group-hover:opacity-90" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold tracking-tight text-foreground truncate">
                            {plan?.name || 'Untitled Plan'}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Radio size={12} className="text-primary/70" />
                                <span className="truncate">{plan?.segment || '—'}</span>
                            </span>
                            {validityLabel && (
                                <span className="inline-flex items-center gap-1">
                                    <Clock size={12} className="text-primary/70" />
                                    {validityLabel}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                        {isPopular && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-1">
                                <Star size={12} />
                                Popular
                            </span>
                        )}

                        <span
                            className={clsx(
                                "text-[10px] font-bold uppercase tracking-widest rounded-full border px-2 py-1",
                                plan?.isDemo
                                    ? "border-blue-500/20 text-blue-500 bg-blue-500/10"
                                    : "border-emerald-500/20 text-emerald-500 bg-emerald-500/10"
                            )}
                        >
                            {planType}
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-3xl font-mono font-bold tracking-tighter tabular-nums text-foreground">
                            {priceLabel}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                            <CreditCard size={12} className="text-primary/70" />
                            {plan?.isDemo ? 'Trial access' : `Billed for ${formatValidity(plan?.durationDays) || 'period'}`}
                        </p>
                    </div>
                </div>

                <div className="mt-5 border-t border-border/60 pt-4 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
                        <List size={12} className="text-primary/70" />
                        Features
                    </p>
                    <ul className="mt-3 space-y-2">
                        {shownFeatures.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                                <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                                <span className="leading-snug">{f}</span>
                            </li>
                        ))}
                        {shownFeatures.length === 0 && (
                            <li className="text-[11px] text-muted-foreground italic">No features set</li>
                        )}
                        {remaining > 0 && (
                            <li className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">
                                +{remaining} more
                            </li>
                        )}
                    </ul>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-center gap-2"
                        onClick={onEdit}
                        title="Edit Plan"
                    >
                        <Edit size={14} />
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="justify-center gap-2"
                        onClick={onDelete}
                        title="Delete Plan"
                    >
                        <Trash2 size={14} />
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};


const AllPlans = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // Sync Search with URL
    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    const [filter, setFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('plans');
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    useEffect(() => {
        const loadPlans = async () => {
            setIsLoading(true);
            try {
                const { fetchPlans } = await import('../../api/plans.api');
                const { data } = await fetchPlans();
                setPlans(data);
            } catch (e) {
                console.error("Failed to load plans", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadPlans();
    }, []);

    const handleAction = async (action, plan) => {
        const planId = plan.id || plan._id;

        if (action === 'edit') {
            navigate(`/plans/edit?id=${planId}`);
        } else if (action === 'delete') {
            setPendingAction({ type: 'delete', planId, planName: plan.name });
            setDialogConfig({
                title: 'Delete Plan',
                message: `Are you sure you want to PERMANENTLY DELETE ${plan.name}? This cannot be undone.`,
                variant: 'danger',
                confirmText: 'Delete Plan'
            });
            setDialogOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            const { deletePlan } = await import('../../api/plans.api');

            if (pendingAction.type === 'delete') {
                await deletePlan(pendingAction.planId);
                setPlans(plans.filter(p => (p.id || p._id) !== pendingAction.planId));
                toast.success('Plan deleted successfully');
            }

            setDialogOpen(false);
        } catch (error) {
            console.error("Action failed", error);
            // Explicitly handle the backend error message about active subscribers
            const msg = error.response?.data?.message || error.message || "Failed to perform action";
            toast.error(msg); // This will show the "Cannot delete plan. It has X active subscribers." message
            setDialogOpen(false);
        }
    };

    const filteredPlans = plans.filter(plan =>
        (filter === 'All' || (filter === 'Demo' ? plan.isDemo : !plan.isDemo)) &&
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const indexOfLastPlan = currentPage * itemsPerPage;
    const indexOfFirstPlan = indexOfLastPlan - itemsPerPage;
    const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm, itemsPerPage]);

    return (
        <div className="h-full flex flex-col gap-4">
            {/* ... Header and Tab Navigation ... */}
            {/* (I'm skipping unchanged header render parts for brevity in this replacement block, but need to be careful with context) */}
            {/* Actually, it's safer to reproduce the structure if I am replacing a big block, or target carefully. */}

            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex items-center gap-1 border-b border-border">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'plans'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <List size={14} /> All Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('validity')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'validity'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Clock size={14} /> Validity Rules
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 relative flex flex-col">
                {activeTab === 'plans' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Plans Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <CreditCard size={16} className="text-primary" />
                                    Plan Database
                                </h2>

                                <div className="hidden sm:block h-6 w-[1px] bg-white/10"></div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-muted-foreground font-medium">Filter:</span>
                                    {['All', 'Premium', 'Demo'].map(f => (
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

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH PLAN..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-7 w-full sm:w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
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
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate('/plans/create')}
                                    className="h-8 text-[11px] gap-1.5 rounded-lg font-bold shadow-lg shadow-primary/20 w-full sm:w-auto"
                                >
                                    <Plus size={12} /> New Plan
                                </Button>
                            </div>
                        </div>

                        {/* Plans Cards */}
                        <div className="flex-1 min-h-0 relative overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-1">
                                {isLoading
                                    ? [...Array(6)].map((_, idx) => <PlanCardSkeleton key={`plan-skel-${idx}`} />)
                                    : currentPlans.map((plan) => {
                                        const premiumPlans = filteredPlans.filter((p) => !p.isDemo);
                                        const maxPrice = premiumPlans.reduce((m, p) => Math.max(m, Number(p.price) || 0), 0);
                                        const isPopular = !plan.isDemo && (Number(plan.price) || 0) === maxPrice && premiumPlans.length > 1;

                                        return (
                                            <PlanCard
                                                key={plan.id || plan._id || plan.name}
                                                plan={plan}
                                                isPopular={isPopular}
                                                onEdit={() => handleAction('edit', plan)}
                                                onDelete={() => handleAction('delete', plan)}
                                            />
                                        );
                                    })}
                            </div>

                            {!isLoading && filteredPlans.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                    <CreditCard size={48} strokeWidth={1} />
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Plans Found</p>
                                        <p className="text-[10px] font-mono mt-1">Try adjusting filters or create a new plan</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Stats */}
                        {/* Footer Stats & Pagination */}
                        <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            <div className="flex items-center gap-4">
                                <span>
                                    {filteredPlans.length > 0 ? (
                                        <>Showing <span className="text-foreground font-bold">{indexOfFirstPlan + 1}-{Math.min(indexOfLastPlan, filteredPlans.length)}</span> of <span className="text-foreground font-bold">{filteredPlans.length}</span></>
                                    ) : (
                                        <span className="text-muted-foreground">No plans found</span>
                                    )}
                                    <span className="text-muted-foreground/50 mx-2">|</span>
                                    Total: <span className="text-foreground font-bold">{plans.length}</span>
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

                                <span>Active: <span className="text-emerald-500 font-bold">{plans.filter(p => !p.isDemo).length}</span></span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'validity' && (
                    <div className="h-full overflow-y-auto px-4 py-2">
                        <PlanValiditySettings isEmbedded={true} />
                    </div>
                )}


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

export default AllPlans;
