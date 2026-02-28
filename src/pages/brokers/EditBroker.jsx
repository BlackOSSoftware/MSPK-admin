import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, X, Briefcase, MapPin, DollarSign, Percent, Loader } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useToast from '../../hooks/useToast';
import { getSubBroker, updateSubBroker } from '../../api/subbrokers.api';
import { useForm } from 'react-hook-form';

const EditBroker = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const brokerID = searchParams.get('id');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            commissionType: 'PERCENTAGE',
            commissionValue: 20,
            status: 'Active'
        }
    });

    const commissionType = watch('commissionType');

    useEffect(() => {
        if (!brokerID) {
            toast.error("Invalid Broker ID");
            navigate('/brokers/all');
            return;
        }

        const fetchDetails = async () => {
            try {
                const { data } = await getSubBroker(brokerID);
                const broker = data.subBroker;

                // Reset form with fetched values
                reset({
                    name: broker.name,
                    email: broker.email,
                    phone: broker.phone,
                    company: broker.company,
                    location: broker.location,
                    commissionType: broker.commission?.type || 'PERCENTAGE',
                    commissionValue: broker.commission?.value || 0,
                    status: broker.status
                });
            } catch (error) {
                console.error("Failed to fetch broker", error);
                toast.error("Failed to load broker details");
                navigate('/brokers/all');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [brokerID, navigate, reset, toast]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        const updatePayload = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            location: data.location,
            commission: {
                type: data.commissionType,
                value: Number(data.commissionValue)
            },
            status: data.status
        };

        try {
            await updateSubBroker(brokerID, updatePayload);
            toast.success('Partner profile updated');
            navigate('/brokers/all');
        } catch (error) {
            console.error("Update failed", error);
            const msg = error.response?.data?.message || 'Failed to update';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse">
                <Loader className="animate-spin mb-2" size={32} />
                <span className="text-xs font-mono uppercase tracking-widest">Loading Profile...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Edit Partner Profile</h1>
                <Button variant="outline" onClick={() => navigate('/brokers/all')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Details */}
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Briefcase size={18} className="text-primary" /> Partner Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Partner Name"
                            {...register("name", { required: "Name is required" })}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Company Name"
                            {...register("company")}
                        />
                        <Input
                            label="Email Address"
                            {...register("email", { required: "Email is required" })}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Phone Number"
                            {...register("phone", { required: "Phone is required" })}
                            error={errors.phone?.message}
                        />
                        <Input
                            label="Location / City"
                            {...register("location")}
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-muted-foreground ml-1">Account Status</label>
                            <select
                                {...register("status")}
                                className="w-full bg-secondary/30 border border-input rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:bg-secondary/50 transition-all text-sm"
                            >
                                <option value="Active">Active</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Commission Configuration */}
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <DollarSign size={18} className="text-primary" /> Commission Structure
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-muted-foreground ml-1">Commission Type</label>
                            <select
                                {...register("commissionType")}
                                className="w-full bg-secondary/30 border border-input rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:bg-secondary/50 transition-all text-sm"
                            >
                                <option value="PERCENTAGE">Percentage (%) Share</option>
                                <option value="FIXED">Fixed Amount (₹)</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Input
                                label={commissionType === 'PERCENTAGE' ? "Commission Percentage (%)" : "Fixed Amount (₹)"}
                                type="number"
                                {...register("commissionValue", { required: "Value is required", min: 0 })}
                                error={errors.commissionValue?.message}
                            />
                            <div className="absolute right-3 top-9 text-muted-foreground pointer-events-none">
                                {commissionType === 'PERCENTAGE' ? <Percent size={14} /> : <span className="text-xs">INR</span>}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate('/brokers/all')}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting} className="min-w-[120px] gap-2">
                        <Save size={16} />
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditBroker;
