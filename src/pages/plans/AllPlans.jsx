import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Clock, List, Check, Edit, Trash2, Star, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="animate-pulse rounded-xl border border-border bg-card/60 overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
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
            <div className="h-8 w-full bg-muted/40 rounded-lg" />
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
                "hover:-translate-y-1 hover:border-primary/40 hover:bg-accent/10 hover:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)]"
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,hsl(var(--primary)/0.12),transparent_45%)] pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                            {plan?.name || 'Untitled Plan'}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-muted-foreground">
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

                    <div className="shrink-0 flex flex-col items-end gap-1.5 sm:gap-2">
                        {isPopular && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-1 shadow-[0_0_12px_hsl(var(--primary)/0.15)]">
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

                <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-2xl sm:text-3xl font-mono font-bold tracking-tighter tabular-nums text-foreground">
                            {priceLabel}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                            <CreditCard size={12} className="text-primary/70" />
                            {plan?.isDemo ? 'Trial access' : `Billed for ${formatValidity(plan?.durationDays) || 'period'}`}
                        </p>
                    </div>
                </div>

                <div className="mt-4 sm:mt-5 border-t border-border/60 pt-3 sm:pt-4 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
                        <List size={12} className="text-primary/70" />
                        Features
                    </p>
                    <ul className="mt-2.5 sm:mt-3 space-y-2">
                        {shownFeatures.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                                <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                                <span className="leading-snug">{f}</span>
                            </li>
                        ))}
                        {shownFeatures.length === 0 && (
                            <li className="text-[10px] sm:text-[11px] text-muted-foreground italic">No features set</li>
                        )}
                        {remaining > 0 && (
                            <li className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">
                                +{remaining} more
                            </li>
                        )}
                    </ul>
                </div>

                <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-center gap-2 text-[11px] border-border/70 hover:border-primary/50"
                        onClick={onEdit}
                        title="Edit Plan"
                    >
                        <Edit size={14} />
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        className="justify-center gap-2 text-[11px]"
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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('plans');
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

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
                        <div className="relative shrink-0 rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.6)]">
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                            <div className="relative p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center">
                                            <CreditCard size={16} className="text-primary" />
                                        </div>
                                        <div className="leading-tight">
                                            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Plans</p>
                                            <h2 className="text-sm sm:text-base font-bold text-foreground">Plan Database</h2>
                                        </div>
                                    </div>

                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/plans/create')}
                                        className="h-9 text-[10px] sm:text-[11px] gap-1.5 rounded-lg font-bold w-full sm:w-auto btn-cancel"
                                    >
                                        <Plus size={12} /> New Plan
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Plans Cards */}
                        <div className="flex-1 min-h-0 relative overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pr-1">
                                {isLoading
                                    ? [...Array(6)].map((_, idx) => <PlanCardSkeleton key={`plan-skel-${idx}`} />)
                                    : plans.map((plan) => {
                                        const premiumPlans = plans.filter((p) => !p.isDemo);
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

                            {!isLoading && plans.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                    <CreditCard size={48} strokeWidth={1} />
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Plans Found</p>
                                        <p className="text-[10px] font-mono mt-1">Create a new plan to get started</p>
                                    </div>
                                </div>
                            )}
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
