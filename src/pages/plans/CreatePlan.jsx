import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Save, X, CreditCard, Layers, CheckSquare, Square, Zap, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { createPlan } from '../../api/plans.api';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';

const schema = yup.object({
    name: yup.string().required('Plan name is required'),
    segment: yup.string().required('Segment is required'),
    price: yup.number().min(0, 'Price must be non-negative').typeError('Price must be a number').required('Price is required'),
    validity_days: yup.number().integer().positive().typeError('Validity must be a number').required('Validity is required'),
    isDemo: yup.boolean().default(false),
}).required();

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

const CreatePlan = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            isDemo: false,
            price: 0
        }
    });

    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [segments, setSegments] = useState([]);

    // Fetch Segments
    React.useEffect(() => {
        const loadSegments = async () => {
            const data = await import('../../api/market.api').then(m => m.getSegments());
            setSegments(data);
        };
        loadSegments();
    }, []);

    // Feature State
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [customFeatures, setCustomFeatures] = useState("");

    const toggleFeature = (id) => {
        setSelectedFeatures(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const customList = customFeatures.split(',').map(f => f.trim()).filter(f => f);
            const finalFeatures = [...selectedFeatures, ...customList];

            if (finalFeatures.length === 0) {
                toast.error("Please select at least one feature or add a custom one.");
                setLoading(false);
                return;
            }

            const payload = {
                name: data.name,
                segment: data.segment,
                price: Number(data.price),
                durationDays: Number(data.validity_days),
                features: finalFeatures,
                isDemo: data.isDemo,
                isActive: true
            };

            await createPlan(payload);
            toast.success("Plan created successfully!");
            navigate('/plans/all');
        } catch (error) {
            console.error("Failed to create plan", error);
            const msg = error.response?.data?.message || error.message || "Failed to create plan";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const isDemo = watch("isDemo");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        Create New Plan
                    </h1>
                </div>
                <Button variant="outline" onClick={() => navigate('/plans/all')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* 1. Basic Configuration Card */}
                <Card className="p-6 space-y-6 overflow-visible">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <CreditCard size={18} className="text-primary" /> Plan Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Plan Name"
                            placeholder="e.g. Platinum Nifty"
                            {...register('name')}
                            error={errors.name?.message}
                        />

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Plan Type</label>
                            <Controller
                                name="isDemo"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={[
                                            { label: 'Premium (Paid)', value: false },
                                            { label: 'Demo (Trial / Free)', value: true }
                                        ]}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Type..."
                                        searchable={false}
                                        variant="standard"
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Segment Access</label>
                            <Controller
                                name="segment"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={segments.map(seg => ({ label: seg.name, value: seg.code }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Segment..."
                                        searchable={false}
                                        variant="standard"
                                    />
                                )}
                            />
                            {errors.segment && <p className="text-xs text-red-500">{errors.segment.message}</p>}
                        </div>

                        <Input
                            label="Price (₹)"
                            type="number"
                            placeholder="0"
                            disabled={isDemo === 'true' || isDemo === true}
                            {...register('price')}
                            error={errors.price?.message}
                        />

                        <Input
                            label="Validity (Days)"
                            type="number"
                            placeholder="30"
                            {...register('validity_days')}
                            error={errors.validity_days?.message}
                        />
                    </div>
                </Card>

                {/* 2. Features Card */}
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Layers size={18} className="text-primary" /> Feature Access & Logic
                    </h2>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-muted-foreground block">Select Signals to Include</label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {STANDARD_FEATURES.map((feature) => {
                                const isSelected = selectedFeatures.includes(feature.id);
                                return (
                                    <div
                                        key={feature.id}
                                        onClick={() => toggleFeature(feature.id)}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected
                                                ? 'bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/20'
                                                : 'bg-secondary/30 border-white/5 text-muted-foreground hover:bg-secondary/50'}
                                        `}
                                    >
                                        {isSelected
                                            ? <CheckSquare size={18} className="text-primary shrink-0" />
                                            : <Square size={18} className="text-muted-foreground/50 shrink-0" />}

                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold select-none">{feature.label}</span>
                                            <span className="text-[9px] uppercase tracking-wider opacity-60 font-mono">{feature.category}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                <FileText size={14} /> Additional Features (Description)
                            </label>
                            <textarea
                                value={customFeatures}
                                onChange={(e) => setCustomFeatures(e.target.value)}
                                className="w-full bg-secondary/50 border border-input rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none placeholder:text-muted-foreground/50"
                                placeholder="Enter any other features separated by commas (e.g. 24/7 Support, Personal Mentor, Risk Analysis...)"
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => navigate('/plans/all')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading} className="min-w-[150px] gap-2 shadow-lg shadow-primary/20">
                        {loading ? 'Processing...' : <><Zap size={16} fill="currentColor" /> Create Plan</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlan;
