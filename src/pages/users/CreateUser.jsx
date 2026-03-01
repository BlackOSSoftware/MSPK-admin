import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { X, User, MapPin } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createUser } from '../../api/users.api';
import { fetchPlans } from '../../api/plans.api';
import { fetchSubBrokers } from '../../api/subbrokers.api';

import useToast from '../../hooks/useToast';

const CreateUser = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [plans, setPlans] = useState([]);
    const [subBrokers, setSubBrokers] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const plansRes = await fetchPlans();
                setPlans(plansRes.data);

                const sbRes = await fetchSubBrokers();
                setSubBrokers(sbRes.data);
            } catch (e) {
                console.error("Failed to load dependency data", e);
                // toast.error("Failed to load form data");
            }
        };
        loadData();
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Formatting payload
            const payload = {
                ...data,
                role: 'user', // Default role
                planId: data.planId === 'none' ? undefined : data.planId,
                subBrokerId: data.subBrokerId === 'none' ? undefined : data.subBrokerId
            };

            await createUser(payload);
            toast.success("Client created successfully!");
            navigate('/users/all');
        } catch (error) {
            console.error("Create failed", error);
            const msg = error.response?.data?.message || error.message;
            toast.error(`Failed to create client: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-3 sm:space-y-6">
            <div className="relative rounded-xl sm:rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-[0_12px_36px_-24px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                <div className="relative p-3 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Client Onboarding</p>
                        <h1 className="text-base sm:text-2xl font-bold text-foreground">Add New Client</h1>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Create access, assign plan, and link partner</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/users/all')} className="gap-2 h-8 sm:h-9 text-[10px] sm:text-[11px] btn-cancel">
                        <X size={14} /> Cancel
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
                <Card className="p-3 sm:p-6 space-y-3 sm:space-y-6">
                    <h2 className="text-xs sm:text-lg font-semibold flex items-center gap-2 border-b border-border/60 pb-2">
                        <User size={16} className="text-primary" /> Personal Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                        <Input
                            label="Full Name"
                            placeholder="e.g. Rajesh Kumar"
                            {...register("name", { required: "Name is required" })}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Email Address"
                            placeholder="client@example.com"
                            {...register("email", { required: "Email is required" })}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Phone Number"
                            placeholder="+91 9876543210"
                            {...register("phone")}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Set initial password"
                            {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
                            error={errors.password?.message}
                        />
                    </div>
                </Card>

                <Card className="p-3 sm:p-6 space-y-3 sm:space-y-6">
                    <h2 className="text-xs sm:text-lg font-semibold flex items-center gap-2 border-b border-border/60 pb-2">
                        <MapPin size={16} className="text-primary" /> Trading Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                        <Input
                            label="Client ID (Custom ID)"
                            placeholder="e.g. MS-2023"
                            {...register("clientId")}
                        />
                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-[11px] font-medium text-muted-foreground block">Subscription Plan</label>
                            <select
                                {...register("planId")}
                                className="w-full h-8 sm:h-10 px-3 rounded-md bg-secondary/50 border border-input text-[10px] sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="none">No Plan</option>
                                {plans.map(p => (
                                    <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.durationDays} Days) - â‚¹{p.price}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-[11px] font-medium text-muted-foreground block">Partner / Sub-Broker</label>
                            <select
                                {...register("subBrokerId")}
                                className="w-full h-8 sm:h-10 px-3 rounded-md bg-secondary/50 border border-input text-[10px] sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="none">Direct Client (No Partner)</option>
                                {subBrokers.map(sb => (
                                    <option key={sb.id || sb._id} value={sb.id || sb._id}>{sb.name}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </Card>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/users/all')} className="h-8 sm:h-9 text-[10px] sm:text-[11px] btn-cancel">
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading} className="h-8 sm:h-9 text-[10px] sm:text-[11px] min-w-[120px]">
                        {loading ? 'Creating...' : 'Create Client'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;