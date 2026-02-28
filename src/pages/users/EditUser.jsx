import React, { useEffect, useState } from 'react';
import { Save, X, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';

const EditUser = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id');
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [plans, setPlans] = useState([]);
    const [subBrokers, setSubBrokers] = useState([]);

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        const loadData = async () => {
            try {
                const { fetchUserById } = await import('../../api/users.api');
                const { fetchPlans } = await import('../../api/plans.api');
                const { fetchSubBrokers } = await import('../../api/subbrokers.api');

                const [userRes, plansRes, sbRes] = await Promise.all([
                    fetchUserById(userId),
                    fetchPlans(),
                    fetchSubBrokers()
                ]);

                const user = userRes.data;
                setPlans(plansRes.data);
                setSubBrokers(sbRes.data);

                // Populate Form
                setValue('name', user.name);
                setValue('email', user.email);
                setValue('phone', user.phone);
                setValue('role', user.role);
                setValue('clientId', user.clientId);
                setValue('equity', user.equity);
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
            const { updateUser } = await import('../../api/users.api');

            // Filter out empty password if not changing
            const payload = { ...data };
            if (!payload.password) delete payload.password;
            if (payload.planId === "") delete payload.planId;
            if (payload.subBrokerId === "") payload.subBrokerId = null;

            await updateUser(userId, payload);
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
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
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
                <Card className="bg-[#050505] border-white/5 space-y-6">
                    <h3 className="text-lg font-bold text-foreground border-b border-white/5 pb-2">Personal Information</h3>

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

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register('password')}
                                    placeholder={isAdminBeingEdited ? "Enter new secure password" : "Leave blank to keep current"}
                                    className="w-full bg-secondary/30 border border-primary/20 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-white">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Trading Configuration */}
                <Card className={`bg-[#050505] border-white/5 space-y-6 ${isAdminBeingEdited ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-lg font-bold text-foreground border-b border-white/5 pb-2">Trading Configuration</h3>

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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</label>
                            <input type="number" {...register('walletBalance')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Equity</label>
                            <input type="number" {...register('equity')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Status</label>
                        <select {...register('status')} disabled={isAdminBeingEdited} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground [&>option]:bg-background">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Liquidated">Liquidated</option>
                        </select>
                    </div>
                </Card>

                {/* Plan & Sub-Broker */}
                {!isAdminBeingEdited && (
                    <Card className="bg-[#050505] border-white/5 space-y-6 lg:col-span-2">
                        <h3 className="text-lg font-bold text-foreground border-b border-white/5 pb-2">Association</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Plan (Update)</label>
                                <select {...register('planId')} className="w-full bg-secondary/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors text-foreground [&>option]:bg-background">
                                    <option value="">Keep Current Plan</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground">Selecting a new plan will terminate the current subscription and start a new one.</p>
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
