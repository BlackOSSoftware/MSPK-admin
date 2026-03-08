import React, { useEffect, useState } from 'react';
import { Save, X, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STANDARD_FEATURES = [
    { id: 'Intraday Equity', label: 'Intraday Equity', category: 'Equity' },
    { id: 'Delivery / Swing', label: 'Delivery / Swing', category: 'Equity' },
    { id: 'Nifty Options', label: 'Nifty Options', category: 'FNO' },
    { id: 'BankNifty Options', label: 'BankNifty Options', category: 'FNO' },
    { id: 'FinNifty Options', label: 'FinNifty Options', category: 'FNO' },
    { id: 'Stock Options', label: 'Stock Options', category: 'FNO' },
    { id: 'MCX Futures', label: 'MCX Futures', category: 'Commodity' },
    { id: 'Currency', label: 'Currency', category: 'Forex' },
    { id: 'BTST Calls', label: 'BTST Calls', category: 'Special' },
    { id: 'Hero Zero Trades', label: 'Hero Zero Trades', category: 'Special' },
];

const ALLOWED_SEGMENTS = ['EQUITY', 'FNO', 'COMMODITY', 'CURRENCY', 'CRYPTO', 'FOREX', 'OPTIONS'];

const EditUser = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id');
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [plans, setPlans] = useState([]);
    const [subBrokers, setSubBrokers] = useState([]);
    const [marketSegments, setMarketSegments] = useState([]);
    const [assignMode, setAssignMode] = useState('existing');
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [customFeatures, setCustomFeatures] = useState('');

    const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            customPlanName: 'Custom As User Requirement',
            customPlanDescription: 'Custom access configured by admin',
            customPlanDurationDays: 30,
            customPlanIsActive: true,
            customPlanSegments: []
        }
    });

    const toggleFeature = (id) => {
        setSelectedFeatures(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const { fetchUserById } = await import('../../api/users.api');
                const { fetchPlans } = await import('../../api/plans.api');
                const { fetchSubBrokers } = await import('../../api/subbrokers.api');
                const { getSegments } = await import('../../api/market.api');

                const [userRes, plansRes, sbRes, segmentsRes] = await Promise.all([
                    fetchUserById(userId),
                    fetchPlans(),
                    fetchSubBrokers(),
                    getSegments()
                ]);

                const user = userRes.data;
                setPlans(plansRes.data);
                setSubBrokers(sbRes.data);
                setMarketSegments(Array.isArray(segmentsRes) ? segmentsRes : []);

                // Populate Form
                setValue('name', user.name);
                setValue('email', user.email);
                setValue('phone', user.phone);
                setValue('tradingViewId', user.tradingViewId || '');
                setValue('role', user.role);
                setValue('clientId', user.clientId);
                setValue('walletBalance', user.walletBalance);
                setValue('status', user.status);

                // Handle optional ID population (check if populated object or raw ID)
                const sbId = user.subBrokerId && typeof user.subBrokerId === 'object' ? user.subBrokerId.id : user.subBrokerId;
                setValue('subBrokerId', sbId || '');

                // Determine plan (backend returns simplified plan name in some views, but we need ID for edit)
                // For now, if we don't have the subscription ID directly, we might leave it blank or try to match
                // Ideally backend getUser returns current subscription details properly. 
                // Assuming getUser response has subscription info or we default to empty if not found.
                // NOTE: Detailed subscription linking might need backend enhancement to return planId directly on user object or separate call.
                // For now, let's leave plan as "Keep Current" (empty) unless changed.

            } catch (error) {
                console.error("Failed to load user data", error);
                toast.error("Failed to load user details");
                navigate('/users/all');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadData();
        }
    }, [userId, setValue, navigate, toast]);

    const onSubmit = async (data) => {
        try {
            const { updateUser, assignCustomPlan } = await import('../../api/users.api');
            let customPayload = null;

            // Filter out empty password if not changing
            const payload = { ...data };
            if (!payload.password) delete payload.password;
            if (payload.planId === "") delete payload.planId;
            if (payload.subBrokerId === "") payload.subBrokerId = null;
            if (payload.planId && !/^[a-fA-F0-9]{24}$/.test(payload.planId)) {
                delete payload.planId;
            }
            if (assignMode === 'custom') {
                delete payload.planId;
            }

            delete payload.customPlanName;
            delete payload.customPlanDescription;
            delete payload.customPlanPrice;
            delete payload.customPlanDurationDays;
            delete payload.customPlanIsActive;
            delete payload.customPlanSegments;

            if (assignMode === 'custom') {
                const featuresList = Array.from(new Set([
                    ...selectedFeatures,
                    ...customFeatures.split(',').map(f => f.trim()).filter(Boolean)
                ]));
                const normalizedSegments = (data.customPlanSegments || [])
                    .map(seg => String(seg).toUpperCase())
                    .filter(Boolean);
                const invalidSegments = normalizedSegments.filter(seg => !ALLOWED_SEGMENTS.includes(seg));

                customPayload = {
                    name: data.customPlanName,
                    description: data.customPlanDescription,
                    price: Number(data.customPlanPrice),
                    durationDays: Number(data.customPlanDurationDays),
                    isActive: !!data.customPlanIsActive,
                    isDemo: false
                };

                if (invalidSegments.length > 0) {
                    toast.error(`Invalid segments: ${invalidSegments.join(', ')}`);
                    return;
                }

                if (normalizedSegments.length > 0) {
                    customPayload.segments = normalizedSegments;
                }

                if (featuresList.length > 0) {
                    customPayload.features = featuresList;
                }

                if (!customPayload.name || !customPayload.durationDays) {
                    toast.error("Please fill custom plan name and duration days.");
                    return;
                }
            }

            await updateUser(userId, payload);

            if (customPayload) {
                await assignCustomPlan(userId, customPayload);
            }
            toast.success("Client details updated successfully");
            navigate('/users/all');
        } catch (error) {
            console.error("Update failed", error);
            toast.error(error.response?.data?.message || "Failed to update client");
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-muted-foreground">Loading client details...</div>;
    }

    const userRole = watch('role');
    const isAdminBeingEdited = userRole === 'admin';
    const segmentOptions = ALLOWED_SEGMENTS.map((code) => {
        const match = marketSegments.find(seg => String(seg.code || '').toUpperCase() === code);
        return { label: match?.name || code, value: code };
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isAdminBeingEdited ? 'Admin Account Security' : 'Edit Client'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {isAdminBeingEdited ? 'Update administrator credentials' : 'Update client details and permissions'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="btn-cancel" type="button" variant="outline" onClick={() => navigate(-1)}>
                        <X size={16} /> Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting} className="shadow-lg shadow-primary/20">
                        <Save size={16} /> {isSubmitting ? 'Saving...' : isAdminBeingEdited ? 'Update Password' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {isAdminBeingEdited && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-center gap-3">
                    <ShieldAlert size={20} className="text-yellow-500 shrink-0" />
                    <div>
                        <p className="text-[11px] font-bold text-yellow-500 uppercase tracking-widest">Administrator Restricted Mode</p>
                        <p className="text-[10px] text-yellow-500/80">For security reasons, admin profile details cannot be modified here. You can only change the password.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Info */}
                <Card className="space-y-6">
                    <h3 className="text-lg font-bold text-foreground border-b border-border/70 pb-2">Personal Information</h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                            <input
                                {...register('name', { required: 'Name is required' })}
                                disabled={isAdminBeingEdited}
                                className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {errors.name && <span className="text-xs text-rose-500">{errors.name.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                            <input
                                type="email"
                                {...register('email', { required: 'Email is required' })}
                                disabled={isAdminBeingEdited}
                                className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {!isAdminBeingEdited && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                                <input {...register('phone')} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground" />
                            </div>
                        )}

                        {!isAdminBeingEdited && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">TradingView ID</label>
                                <input
                                    {...register('tradingViewId')}
                                    placeholder="e.g. trader_123"
                                    className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register('password')}
                                    placeholder={isAdminBeingEdited ? "Enter new secure password" : "Leave blank to keep current"}
                                    className="w-full bg-secondary/30 border border-primary/20 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Trading Configuration */}
                <Card className={`space-y-6 ${isAdminBeingEdited ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-lg font-bold text-foreground border-b border-border/70 pb-2">Trading Configuration</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client ID</label>
                            <input {...register('clientId')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground disabled:bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</label>
                            <select {...register('role')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground [&>option]:bg-background disabled:bg-transparent">
                                <option value="user">User</option>
                                <option value="sub-broker">Sub Broker</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</label>
                            <input type="number" {...register('walletBalance')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Status</label>
                        <select {...register('status')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground [&>option]:bg-background">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Blocked">Blocked</option>
                        </select>
                    </div>
                </Card>

                {/* Plan & Sub-Broker */}
                {!isAdminBeingEdited && (
                    <Card className="space-y-6 lg:col-span-2">
                        <h3 className="text-lg font-bold text-foreground border-b border-border/70 pb-2">Association</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Plan (Update)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAssignMode('existing')}
                                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${assignMode === 'existing'
                                            ? 'border-primary/50 bg-primary/10 text-primary'
                                            : 'border-white/10 bg-secondary/30 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Existing Plan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAssignMode('custom')}
                                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${assignMode === 'custom'
                                            ? 'border-primary/50 bg-primary/10 text-primary'
                                            : 'border-white/10 bg-secondary/30 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Custom Plan
                                    </button>
                                </div>

                                {assignMode === 'existing' ? (
                                    <>
                                        <select {...register('planId')} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground [&>option]:bg-background">
                                            <option value="">Keep Current Plan</option>
                                            {plans.filter(plan => {
                                                const isCustom = !plan.isDemo && Number(plan.price) === 0;
                                                return !isCustom;
                                            }).map(plan => {
                                                const isCustom = !plan.isDemo && Number(plan.price) === 0;
                                                const priceLabel = plan.isDemo ? 'Free' : (isCustom ? `Custom/${plan.durationDays} Days` : `INR ${plan.price}`);
                                                const suffix = priceLabel ? ` - ${priceLabel}` : '';
                                                return (
                                                    <option key={plan._id || plan.id} value={plan._id || plan.id}>
                                                        {plan.name}{suffix}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <p className="text-[10px] text-muted-foreground">Selecting a new plan will terminate the current subscription and start a new one.</p>
                                    </>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plan Name</label>
                                                <input
                                                    {...register('customPlanName')}
                                                    className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                                                <input
                                                    {...register('customPlanDescription')}
                                                    className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (INR)</label>
                                                <input
                                                    type="number"
                                                    {...register('customPlanPrice')}
                                                    className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration (Days)</label>
                                                <input
                                                    type="number"
                                                    {...register('customPlanDurationDays')}
                                                    className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Segments (Optional)</label>
                                            <Controller
                                                name="customPlanSegments"
                                                control={control}
                                                render={({ field }) => (
                                                    <SearchableSelect
                                                        options={segmentOptions}
                                                        value={(field.value || []).filter(v => ALLOWED_SEGMENTS.includes(String(v).toUpperCase()))}
                                                        onChange={(vals) => {
                                                            const cleaned = (vals || [])
                                                                .map(v => String(v).toUpperCase())
                                                                .filter(v => ALLOWED_SEGMENTS.includes(v));
                                                            field.onChange(cleaned);
                                                        }}
                                                        placeholder="Select segments..."
                                                        searchable={false}
                                                        variant="standard"
                                                        multiple
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Features (Optional)</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {STANDARD_FEATURES.map((feature) => {
                                                    const isSelected = selectedFeatures.includes(feature.id);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={feature.id}
                                                            onClick={() => toggleFeature(feature.id)}
                                                            className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-tight transition-all text-left ${isSelected
                                                                ? 'border-primary/50 bg-primary/10 text-primary'
                                                                : 'border-white/10 bg-secondary/30 text-muted-foreground hover:text-foreground'
                                                                }`}
                                                        >
                                                            <span className="block">{feature.label}</span>
                                                            <span className="block text-[9px] uppercase tracking-wider opacity-70">{feature.category}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <textarea
                                                value={customFeatures}
                                                onChange={(e) => setCustomFeatures(e.target.value)}
                                                className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-[11px] focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                                                rows={3}
                                                placeholder="Add more features separated by commas"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                            <label className="flex items-center gap-2">
                                                <input type="checkbox" {...register('customPlanIsActive')} className="accent-primary" />
                                                Active
                                            </label>
                                        </div>

                                        <p className="text-[10px] text-muted-foreground">Custom plan assignment will expire the current subscription and create a new one.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Sub-Broker</label>
                                <select {...register('subBrokerId')} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground [&>option]:bg-background">
                                    <option value="">Direct Client (No Sub-Broker)</option>
                                    {subBrokers.map(sb => (
                                        <option key={sb.id} value={sb.id}>{sb.name} ({sb.clientId})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </form>
    );
};

export default EditUser;
