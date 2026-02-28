import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Save, X, User, MapPin } from 'lucide-react';
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
                equity: Number(data.equity),
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
                <Button variant="outline" onClick={() => navigate('/users/all')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <User size={18} className="text-primary" /> Personal Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <MapPin size={18} className="text-primary" /> Trading Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Client ID (Custom ID)"
                            placeholder="e.g. MS-2023"
                            {...register("clientId")}
                        />
                        <Input
                            label="Initial Equity (₹)"
                            type="number"
                            placeholder="0"
                            {...register("equity")}
                        />

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground block">Subscription Plan</label>
                            <select
                                {...register("planId")}
                                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="none">No Plan</option>
                                {plans.map(p => (
                                    <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.durationDays} Days) - ₹{p.price}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground block">Partner / Sub-Broker</label>
                            <select
                                {...register("subBrokerId")}
                                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="none">Direct Client (No Partner)</option>
                                {subBrokers.map(sb => (
                                    <option key={sb.id || sb._id} value={sb.id || sb._id}>{sb.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground block">Status</label>
                            <select
                                {...register("status")}
                                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/users/all')}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading} className="min-w-[120px]">
                        {loading ? 'Creating...' : 'Create Client'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;
