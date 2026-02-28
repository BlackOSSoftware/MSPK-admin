import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Removed unused useFieldArray
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Target, Shield, AlertTriangle, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import useToast from '../../hooks/useToast';
import { getSegments, getSymbols } from '../../api/market.api';

const schema = yup.object({
    symbol: yup.string().required('Symbol is required').uppercase(),
    segment: yup.string().required('Segment is required'),
    type: yup.string().oneOf(['BUY', 'SELL']).required('Type is required'),
    entry: yup.number().typeError('Must be a number').required('Entry price is required'),
    stoploss: yup.number().typeError('Must be a number').required('Stoploss is required'),
    target1: yup.number().typeError('Must be a number').required('Target 1 is required'),
    target2: yup.number().typeError('Must be a number').nullable().transform((v, o) => o === '' ? null : v),
    target3: yup.number().typeError('Must be a number').nullable().transform((v, o) => o === '' ? null : v),
    notes: yup.string(),
    isFree: yup.boolean()
}).required();

const CreateSignal = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [segments, setSegments] = useState([]);
    const [symbols, setSymbols] = useState([]);

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            type: 'BUY',
            segment: '',
            isFree: false
        }
    });

    const signalType = watch('type');
    const selectedSegment = watch('segment');

    // 1. Fetch Segments on Mount
    useEffect(() => {
        const loadSegments = async () => {
            try {
                const data = await getSegments();
                setSegments(data);
                if (data.length > 0) {
                    setValue('segment', data[0].code);
                }
            } catch (error) {
                console.error("Failed to load segments", error);
                toast.error("Failed to load market segments");
            }
        };
        loadSegments();
    }, [setValue]);

    // 2. Fetch Symbols when Segment Changes
    useEffect(() => {
        const loadSymbols = async () => {
            if (!selectedSegment) return;
            try {
                const data = await getSymbols(selectedSegment);
                setSymbols(data);
                setValue('symbol', '');
            } catch (error) {
                console.error("Failed to load symbols", error);
                toast.error("Failed to load symbols");
            }
        };
        loadSymbols();
    }, [selectedSegment, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const payload = {
                symbol: data.symbol,
                segment: data.segment,
                type: data.type,
                entryPrice: data.entry,
                stopLoss: data.stoploss,
                targets: {
                    target1: data.target1,
                    target2: data.target2 || null, // Ensure null if empty
                    target3: data.target3 || null
                },
                notes: data.notes,
                isFree: data.isFree
            };

            await import('../../api/signals.api').then(m => m.createSignal(payload));
            toast.success('Signal published successfully');
            navigate('/signals/all');
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to create signal');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        Post New Signal
                    </h1>
                </div>
                <Button variant="outline" onClick={() => navigate('/signals/all')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* 1. Signal Configuration Card */}
                <Card className="p-6 space-y-6 overflow-visible">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Target size={18} className="text-primary" /> Signal Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Segment</label>
                            <select
                                {...register('segment')}
                                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {segments.map(seg => (
                                    <option key={seg._id} value={seg.code}>{seg.name}</option>
                                ))}
                            </select>
                            {errors.segment && <p className="text-xs text-red-500">{errors.segment.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground block">Symbol / Scrip</label>
                            <Controller
                                name="symbol"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={symbols.map(s => ({ label: s.symbol, value: s.symbol }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Instrument..."
                                        searchPlaceholder="Search NIFTY, RELIANCE..."
                                        variant="standard"
                                        disabled={!selectedSegment}
                                    />
                                )}
                            />
                            {errors.symbol && <p className="text-xs text-red-500">{errors.symbol.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Action Type</label>
                            <div className="grid grid-cols-2 gap-3 h-10">
                                <label className={`cursor-pointer border rounded-md flex items-center justify-center gap-2 transition-all ${signalType === 'BUY' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold' : 'bg-secondary/50 border-input text-muted-foreground hover:bg-secondary/80'}`}>
                                    <input type="radio" value="BUY" {...register('type')} className="hidden" />
                                    BUY
                                </label>
                                <label className={`cursor-pointer border rounded-md flex items-center justify-center gap-2 transition-all ${signalType === 'SELL' ? 'bg-red-500/10 border-red-500 text-red-500 font-bold' : 'bg-secondary/50 border-input text-muted-foreground hover:bg-secondary/80'}`}>
                                    <input type="radio" value="SELL" {...register('type')} className="hidden" />
                                    SELL
                                </label>
                            </div>
                        </div>

                        <Input
                            label="Entry Price"
                            type="number"
                            step="0.05"
                            placeholder="0.00"
                            {...register('entry')}
                            error={errors.entry?.message}
                        />

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Signal Access</label>
                            <select
                                {...register('isFree')}
                                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value={false}>Premium (Paid Users)</option>
                                <option value={true}>Free (All Users)</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* 2. Risk & Reward Card */}
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Shield size={18} className="text-primary" /> Risk Management
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Input
                            label="Stop Loss"
                            type="number"
                            step="0.05"
                            placeholder="Risk Level"
                            {...register('stoploss')}
                            error={errors.stoploss?.message}
                            className="border-red-500/30 focus:border-red-500"
                        />

                        <Input
                            label="Target 1"
                            type="number"
                            step="0.05"
                            {...register('target1')}
                            error={errors.target1?.message}
                            className="border-emerald-500/20 focus:border-emerald-500"
                        />
                        <Input
                            label="Target 2"
                            type="number"
                            step="0.05"
                            {...register('target2')}
                            className="border-emerald-500/20 focus:border-emerald-500"
                        />
                        <Input
                            label="Target 3"
                            type="number"
                            step="0.05"
                            {...register('target3')}
                            className="border-emerald-500/20 focus:border-emerald-500"
                        />
                    </div>
                </Card>

                {/* 3. Analysis Card */}
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <AlertTriangle size={18} className="text-primary" /> Analysis & Notes
                    </h2>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground block">Trade Logic (Optional)</label>
                        <textarea
                            {...register('notes')}
                            rows="2"
                            className="w-full bg-secondary/50 border border-input rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            placeholder="Add brief analysis or reasoning for this trade (e.g. 'Breakout at 18000')"
                        ></textarea>
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => navigate('/signals/all')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting} className="min-w-[150px] gap-2 shadow-lg shadow-primary/20">
                        {isSubmitting ? 'Publishing...' : <><Target size={16} /> Publish Signal</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateSignal;
