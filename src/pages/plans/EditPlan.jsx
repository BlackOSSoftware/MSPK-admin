import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, X, CreditCard, Layers, CheckSquare, Square, FileText, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { fetchPlanById, updatePlan } from '../../api/plans.api';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';
import {
    buildPlanSegmentOptions,
    normalizePlanSegmentSelection,
    PLAN_TYPE_OPTIONS,
    splitPlanFeatures,
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

const EditPlan = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const planId = searchParams.get('id');
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [segments, setSegments] = useState([]);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [customFeatures, setCustomFeatures] = useState('');

    const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            planType: 'premium',
            price: 0,
            description: '',
            segments: [],
            isActive: true,
        }
    });

    useEffect(() => {
        const loadSegments = async () => {
            const data = await import('../../api/market.api').then((m) => m.getSegments());
            setSegments(data);
        };
        loadSegments();
    }, []);

    const segmentOptions = buildPlanSegmentOptions(segments);
    const planType = watch('planType');
    const isActive = watch('isActive');

    useEffect(() => {
        const loadPlan = async () => {
            if (!planId) {
                toast.error('No plan ID provided');
                navigate('/plans/all');
                return;
            }

            try {
                const { data } = await fetchPlanById(planId);
                const resolvedPlanType = data.isDemo ? 'demo' : (data.isCustom ? 'custom' : 'premium');
                const loadedSegments = Array.isArray(data.segments) && data.segments.length > 0 ? data.segments : (data.segment ? [data.segment] : []);

                reset({
                    name: data.name || '',
                    description: data.description || '',
                    segments: loadedSegments,
                    planType: resolvedPlanType,
                    price: data.price ?? 0,
                    validity_days: data.durationDays ?? '',
                    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
                });

                const { selectedStandard, selectedCustom } = splitPlanFeatures(data.features || []);
                setSelectedFeatures(selectedStandard);
                setCustomFeatures(selectedCustom.join(', '));
            } catch (error) {
                console.error('Failed to fetch plan', error);
                toast.error('Failed to load plan details');
                navigate('/plans/all');
            } finally {
                setFetching(false);
            }
        };

        loadPlan();
    }, [planId, navigate, reset, toast]);

    useEffect(() => {
        if (planType !== 'premium') {
            setValue('price', 0, { shouldValidate: true });
        }
    }, [planType, setValue]);

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
            await updatePlan(planId, {
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

            toast.success('Plan updated successfully!');
            navigate('/plans/all');
        } catch (error) {
            console.error('Failed to update plan', error);
            const msg = error.response?.data?.message || error.message || 'Failed to update plan';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">Loading Plan Details...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        Edit Plan
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">UPDATE</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Modify subscription details, permissions, and segment access.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/plans/all')} className="gap-2 btn-cancel">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-6 space-y-6 overflow-visible">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <CreditCard size={18} className="text-primary" /> Plan Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="Plan Name" placeholder="e.g. Platinum Nifty" {...register('name')} error={errors.name?.message} />

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Plan Type</label>
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

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground block">Segment Access</label>
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

                        <div className="space-y-1.5 md:col-span-3">
                            <label className="text-xs font-medium text-muted-foreground block">Description</label>
                            <textarea {...register('description')} className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Short plan description for admin and future display use" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground block">Plan Status</label>
                            <button type="button" onClick={() => setValue('isActive', !isActive, { shouldDirty: true })} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-border bg-card text-muted-foreground'}`}>
                                <div className="flex items-center gap-2">
                                    {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    <span className="text-sm font-semibold">{isActive ? 'Active Plan' : 'Inactive Plan'}</span>
                                </div>
                                <Shield size={14} />
                            </button>
                        </div>
                    </div>
                </Card>

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
                                    <div key={feature.id} onClick={() => toggleFeature(feature.id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/20' : 'bg-secondary/30 border-white/5 text-muted-foreground hover:bg-secondary/50'}`}>
                                        {isSelected ? <CheckSquare size={18} className="text-primary shrink-0" /> : <Square size={18} className="text-muted-foreground/50 shrink-0" />}
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
                            <textarea value={customFeatures} onChange={(e) => setCustomFeatures(e.target.value)} className="w-full bg-secondary/50 border border-input rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none placeholder:text-muted-foreground/50" placeholder="Enter any other features separated by commas (e.g. 24/7 Support, Personal Mentor, Risk Analysis...)" />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button className="btn-cancel" type="button" variant="outline" onClick={() => navigate('/plans/all')}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading} className="min-w-[150px] gap-2 shadow-lg shadow-primary/20">
                        {loading ? 'Processing...' : <><Save size={16} fill="currentColor" /> Update Plan</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditPlan;
