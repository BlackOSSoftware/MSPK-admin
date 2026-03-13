import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, Layers, CheckSquare, Square, Zap, FileText, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { createPlan } from '../../api/plans.api';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';
import {
    buildPlanSegmentOptions,
    normalizePlanSegmentSelection,
    PLAN_TYPE_OPTIONS,
    STANDARD_FEATURES,
} from './planFormConfig';

const schema = yup.object({
    name: yup.string().required('Plan name is required'),
    description: yup.string().nullable(),
    segments: yup.array().of(yup.string()).min(1, 'At least one segment is required'),
    planType: yup.string().oneOf(['premium', 'demo', 'custom']).required('Plan type is required'),
    price: yup.number().min(0, 'Price must be non-negative').typeError('Price must be a number').when('planType', {
        is: 'premium',
        then: (rule) => rule.required('Price is required'),
        otherwise: (rule) => rule.notRequired()
    }),
    validity_days: yup.number().integer().positive().typeError('Validity must be a number').required('Validity is required'),
    isActive: yup.boolean().default(true),
}).required();

const CreatePlan = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            planType: 'premium',
            price: 0,
            description: '',
            segments: [],
            isActive: true,
        }
    });

    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [segments, setSegments] = useState([]);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [customFeatures, setCustomFeatures] = useState('');

    React.useEffect(() => {
        const loadSegments = async () => {
            const data = await import('../../api/market.api').then((m) => m.getSegments());
            setSegments(data);
        };
        loadSegments();
    }, []);

    const segmentOptions = buildPlanSegmentOptions(segments);
    const planType = watch('planType');
    const isActive = watch('isActive');

    const toggleFeature = (id) => {
        setSelectedFeatures((prev) => prev.includes(id) ? prev.filter((feature) => feature !== id) : [...prev, id]);
    };

    const handleSegmentChange = (nextValue) => {
        const currentValue = watch('segments');
        setValue('segments', normalizePlanSegmentSelection(nextValue, segmentOptions, currentValue), {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const customList = customFeatures.split(',').map((feature) => feature.trim()).filter(Boolean);
            const finalFeatures = [...selectedFeatures, ...customList];

            if (finalFeatures.length === 0) {
                toast.error('Please select at least one feature or add a custom one.');
                setLoading(false);
                return;
            }

            const normalizedSegments = normalizePlanSegmentSelection(data.segments, segmentOptions);
            await createPlan({
                name: data.name,
                description: data.description?.trim() || '',
                segment: normalizedSegments[0],
                segments: normalizedSegments,
                price: data.planType === 'premium' ? Number(data.price) : 0,
                durationDays: Number(data.validity_days),
                features: finalFeatures,
                isDemo: data.planType === 'demo',
                isCustom: data.planType === 'custom',
                isActive: !!data.isActive,
            });

            toast.success('Plan created successfully!');
            navigate('/plans/all');
        } catch (error) {
            console.error('Failed to create plan', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create plan';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (planType !== 'premium') {
            setValue('price', 0, { shouldValidate: true });
        }
    }, [planType, setValue]);

    return (
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div className="relative rounded-xl sm:rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-[0_12px_36px_-24px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                <div className="relative p-3 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex flex-col">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Plan Builder</p>
                        <h1 className="text-base sm:text-2xl font-bold text-foreground">Create New Plan</h1>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Define pricing, validity, permissions, and segment access</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/plans/all')} className="gap-2 h-8 sm:h-9 text-[10px] sm:text-[11px] btn-cancel">
                        <X size={14} /> Cancel
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
                <Card className="p-3 sm:p-6 space-y-3 sm:space-y-6 overflow-visible">
                    <h2 className="text-xs sm:text-lg font-semibold flex items-center gap-2 border-b border-border/60 pb-2">
                        <CreditCard size={16} className="text-primary" /> Plan Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                        <Input label="Plan Name" placeholder="e.g. Platinum Nifty" {...register('name')} error={errors.name?.message} />

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground block">Plan Type</label>
                            <Controller
                                name="planType"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={PLAN_TYPE_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Type..."
                                        searchable={false}
                                        variant="standard"
                                    />
                                )}
                            />
                        </div>

                        <Input label="Price (INR)" type="number" placeholder="0" disabled={planType !== 'premium'} {...register('price')} error={errors.price?.message} />
                        <Input label="Validity (Days)" type="number" placeholder="30" {...register('validity_days')} error={errors.validity_days?.message} />

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground block">Segment Access</label>
                            <Controller
                                name="segments"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={segmentOptions}
                                        value={field.value}
                                        onChange={handleSegmentChange}
                                        placeholder="Select Segment(s)..."
                                        variant="standard"
                                        multiple={true}
                                    />
                                )}
                            />
                            {errors.segments && <p className="text-xs text-red-500">{errors.segments.message}</p>}
                            <p className="text-[10px] text-muted-foreground">`All Segments` select karoge to woh akela rahega. Kisi specific segment ko select karoge to `All` auto remove ho jayega.</p>
                        </div>

                        <div className="space-y-1 md:col-span-3">
                            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground block">Description</label>
                            <textarea {...register('description')} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-[11px] sm:text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Short plan description for admin and future display use" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground block">Plan Status</label>
                            <button type="button" onClick={() => setValue('isActive', !isActive, { shouldDirty: true })} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-border bg-card text-muted-foreground'}`}>
                                <div className="flex items-center gap-2">
                                    {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    <span className="text-[11px] sm:text-sm font-semibold">{isActive ? 'Active Plan' : 'Inactive Plan'}</span>
                                </div>
                                <Shield size={14} />
                            </button>
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-6 space-y-3 sm:space-y-6">
                    <h2 className="text-xs sm:text-lg font-semibold flex items-center gap-2 border-b border-border/60 pb-2">
                        <Layers size={16} className="text-primary" /> Feature Access & Logic
                    </h2>

                    <div className="space-y-3 sm:space-y-4">
                        <label className="text-[10px] sm:text-sm font-medium text-muted-foreground block">Select Signals to Include</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                            {STANDARD_FEATURES.map((feature) => {
                                const isSelected = selectedFeatures.includes(feature.id);
                                return (
                                    <div key={feature.id} onClick={() => toggleFeature(feature.id)} className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/20' : 'bg-secondary/30 border-white/5 text-muted-foreground hover:bg-secondary/50'}`}>
                                        {isSelected ? <CheckSquare size={16} className="text-primary shrink-0" /> : <Square size={16} className="text-muted-foreground/50 shrink-0" />}
                                        <div className="flex flex-col">
                                            <span className="text-[11px] sm:text-xs font-semibold select-none">{feature.label}</span>
                                            <span className="text-[9px] uppercase tracking-wider opacity-60 font-mono">{feature.category}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                            <label className="flex items-center gap-2 text-[10px] sm:text-sm font-medium text-muted-foreground mb-2">
                                <FileText size={14} /> Additional Features (Description)
                            </label>
                            <textarea value={customFeatures} onChange={(e) => setCustomFeatures(e.target.value)} className="w-full bg-secondary/50 border border-input rounded-lg px-3 py-2 text-[11px] sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 h-20 sm:h-24 resize-none placeholder:text-muted-foreground/50" placeholder="Enter any other features separated by commas (e.g. 24/7 Support, Personal Mentor, Risk Analysis...)" />
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-1 sm:pt-2">
                    <Button type="button" variant="outline" onClick={() => navigate('/plans/all')} className="h-8 sm:h-9 text-[10px] sm:text-[11px] btn-cancel">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading} className="h-8 sm:h-9 text-[10px] sm:text-[11px] min-w-[150px] gap-2 shadow-lg shadow-primary/20">
                        {loading ? 'Processing...' : <><Zap size={14} fill="currentColor" /> Create Plan</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlan;
