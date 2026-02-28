import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Briefcase, MapPin, DollarSign, Percent } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useToast from '../../hooks/useToast';
import { createSubBroker } from '../../api/subbrokers.api';
import { useForm } from 'react-hook-form';

const AddBroker = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Using defaultValues to Initialize form
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            commissionType: 'PERCENTAGE',
            commissionValue: 20
        }
    });

    const commissionType = watch('commissionType');

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        const finalData = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            location: data.location,
            // Robust ID generation: SB-[timestamp_chunk][random_3_digit]
            brokerId: `SB-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`,
            commission: {
                type: data.commissionType,
                value: Number(data.commissionValue)
            }
        };

        try {
            await createSubBroker(finalData);
            toast.success('Partner onboarded successfully');
            navigate('/brokers/all');
        } catch (error) {
            console.error("Failed to create sub broker", error);
            const msg = error.response?.data?.message || 'Failed to onboard broker';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Onboard New Partner</h1>
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
                            placeholder="e.g. Rahul Verma"
                            {...register("name", { required: "Name is required" })}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Company Name"
                            placeholder="e.g. Verma Financials"
                            {...register("company")}
                        />
                        <Input
                            label="Email Address"
                            placeholder="partner@example.com"
                            {...register("email", { required: "Email is required" })}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Phone Number"
                            placeholder="+91 9876543210"
                            {...register("phone", { required: "Phone is required" })}
                            error={errors.phone?.message}
                        />
                        <Input
                            label="Location / City"
                            placeholder="e.g. Mumbai"
                            {...register("location")}
                        />
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
                                className="w-full bg-secondary/30 border border-input rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:bg-secondary/50 transition-all"
                            >
                                <option value="PERCENTAGE">Percentage (%) Share</option>
                                <option value="FIXED">Fixed Amount (₹)</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Input
                                label={commissionType === 'PERCENTAGE' ? "Commission Percentage (%)" : "Fixed Amount (₹)"}
                                type="number"
                                placeholder={commissionType === 'PERCENTAGE' ? "e.g. 20" : "e.g. 500"}
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
                        {isSubmitting ? 'Onboarding...' : 'Onboard Partner'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddBroker;
