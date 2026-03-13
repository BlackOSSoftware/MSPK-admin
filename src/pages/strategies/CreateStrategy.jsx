import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Cpu, X, Plus, Trash2, Sliders, Activity, Zap, Layers, BarChart2, ShieldAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import useToast from '../../hooks/useToast';
import { createStrategy } from '../../api/strategies.api';
import { getSegments, getSymbols } from '../../api/market.api';

// Validation Schema
const schema = yup.object({
    name: yup.string().required('Strategy Name is required'),
    segment: yup.mixed().test('is-segment-valid', 'At least one segment required', val => {
        if (Array.isArray(val)) return val.length > 0;
        return !!val;
    }),
    symbols: yup.array().of(yup.string()).min(1, 'At least one symbol is required'),
    action: yup.string().required('Action is required'),
    candleType: yup.string().required('Candle type is required'),
    timeframe: yup.string().required('Timeframe is required'),
    logic: yup.object({
        rules: yup.array().of(
            yup.object({
                indicator: yup.string().required('Indicator is required'),
                operator: yup.string().required('Operator is required'),
                value: yup.mixed().required('Value is required'), // Can be number or string
                params: yup.object().optional() // Nested params (period, multiplier)
            })
        ).min(1, 'At least one rule is required')
    })
}).required();

const CreateStrategy = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [segments, setSegments] = useState([]);
    const [symbols, setSymbols] = useState([]);
    const [activeTab, setActiveTab] = useState('setup'); // setup, logic, risk

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            segment: [], // Default as array for multi-select
            action: 'ALERT', // Default to Both
            candleType: 'Standard',
            timeframe: '5m',
            symbols: [],
            logic: {
                rules: [{ indicator: 'RSI', operator: '>', value: 50, params: {} }]
            },
            risk: {
                stopLossType: 'Fixed%',
                stopLossValue: 1,
                riskRewardRatio: 2
            }
        }
    });

    const selectedSegment = watch('segment');
    const watchedSymbols = watch('symbols');

    // 1. Fetch Segments on Mount
    useEffect(() => {
        const loadSegments = async () => {
            try {
                const data = await getSegments();
                // Add GLOBAL if not present (mock)
                const allSegments = [...data];
                if (!allSegments.find(s => s.code === 'GLOBAL')) {
                    allSegments.push({ code: 'GLOBAL', name: 'Global / All Markets' });
                }
                setSegments(allSegments);
                if (allSegments.length > 0) {
                    // setValue('segment', allSegments[0].code); // Removed for multi-select
                }
            } catch (error) {
                console.error("Failed to load segments", error);
            }
        };
        loadSegments();
    }, [setValue]);

    // 2. Fetch Symbols when Segment Changes (Handles Multi-Segment)
    useEffect(() => {
        const loadSymbols = async () => {
            const segs = Array.isArray(selectedSegment) ? selectedSegment : (selectedSegment ? [selectedSegment] : []);
            if (segs.length === 0) {
                setSymbols([]); // Clear symbols if no segment is selected
                return;
            }

            try {
                let allSymbols = [];
                // Check if GLOBAL is selected or implies all
                if (segs.includes('GLOBAL')) {
                    setSymbols([
                        { symbol: 'NIFTY 50' }, { symbol: 'BANKNIFTY' }, { symbol: 'CRUDEOIL' }, { symbol: 'GOLD' }, { symbol: 'BTCUSDT' },
                        { symbol: 'RELIANCE' }, { symbol: 'TATASTEEL' }, { symbol: 'HDFCBANK' }
                    ]);
                    return;
                }

                // Fetch for each selected segment and combine
                const promises = segs.map(s => getSymbols(s));
                const results = await Promise.all(promises);

                results.forEach(res => {
                    if (Array.isArray(res)) allSymbols = [...allSymbols, ...res];
                });

                // Dedup by symbol name just in case
                const unique = [...new Map(allSymbols.map(item => [item.symbol, item])).values()];
                setSymbols(unique);

            } catch (error) {
                console.error("Failed to load symbols", error);
            }
        };
        loadSymbols();
    }, [selectedSegment, setValue]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "logic.rules"
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Flatten symbols to single 'symbol' string for backend compat if needed, 
            // OR send 'symbols' array if backend updated. 
            // We updated backend schema to support `symbols` array.
            // Also set `symbol` to first one as primary.

            // Logic: If multiple segments, use GLOBAL. If one, use that one.
            const segmentCode = Array.isArray(data.segment)
                ? (data.segment.length > 1 ? 'GLOBAL' : data.segment[0])
                : data.segment;

            const payload = {
                ...data,
                segment: segmentCode,
                symbol: data.symbols[0], // Primary for old clients
                // 'symbols' array is already in data, so it will be passed
                type: 'CUSTOM_LOGIC',
                status: 'Paused'
            };

            await createStrategy(payload);
            toast.success('Professional Strategy Configured!');
            navigate('/strategies/all');
        } catch (e) {
            console.error(e);
            toast.error('Failed to configure strategy');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: 'setup', label: '1. Setup & Market', icon: Sliders },
        { id: 'logic', label: '2. Entry Rules', icon: Activity },
        { id: 'risk', label: '3. Execution & Risk', icon: ShieldAlert },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Cpu className="text-primary" /> Strategy Studio
                    </h1>
                    <p className="text-muted-foreground text-sm">Professional Algorithmic Trading Configurator</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/strategies/all')}>
                        <X size={16} className="mr-2 btn-cancel" /> Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="min-w-[150px]">
                        {isSubmitting ? 'Deploying...' : 'Deploy Strategy'}
                    </Button>
                </div>
            </div>

            {/* Stepper / Tabs */}
            <div className="flex gap-4 border-b border-border">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 px-4 flex items-center gap-2 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <div className={`p-1.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10' : 'bg-secondary'}`}>
                            <tab.icon size={16} />
                        </div>
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* TAB 1: SETUP */}
                {activeTab === 'setup' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="p-6 space-y-6 overflow-visible z-10">
                            <h3 className="font-bold flex items-center gap-2"><Layers size={18} /> Market Configuration</h3>

                            <Input
                                label="Strategy Name"
                                placeholder="e.g. Nifty Scalper Pro"
                                {...register('name')}
                                error={errors.name?.message}
                            />

                            <div className="space-y-1.5 z-20 relative">
                                <label className="text-xs font-medium text-muted-foreground block">Market Segment (Multi-Select)</label>
                                <Controller
                                    name="segment"
                                    control={control}
                                    render={({ field }) => (
                                        <SearchableSelect
                                            options={segments.map(s => ({ label: s.name, value: s.code }))}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Segments..."
                                            variant="standard"
                                            multiple={true}
                                            dropdownClassName="max-h-60"
                                        />
                                    )}
                                />
                                {errors.segment && <p className="text-xs text-red-500">{errors.segment.message}</p>}
                            </div>

                            <div className="space-y-1.5 z-10 relative">
                                <label className="text-xs font-medium text-muted-foreground block">Target Instruments (Multi-Select)</label>
                                <Controller
                                    name="symbols"
                                    control={control}
                                    render={({ field }) => (
                                        <SearchableSelect
                                            options={symbols.map(s => ({ label: s.symbol, value: s.symbol }))}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Symbols..."
                                            searchPlaceholder="Search instruments..."
                                            variant="standard"
                                            multiple={true}
                                            disabled={!selectedSegment}
                                        />
                                    )}
                                />
                                {errors.symbols && <p className="text-xs text-red-500">{errors.symbols.message}</p>}
                            </div>
                        </Card>

                        <Card className="p-6 space-y-6 overflow-visible">
                            <h3 className="font-bold flex items-center gap-2"><BarChart2 size={18} /> Chart Settings</h3>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground block">Candle Type</label>
                                <div className="grid grid-cols-2 gap-3 h-10">
                                    {['Standard', 'HeikinAshi'].map(type => (
                                        <label key={type} className={`cursor-pointer border rounded-md flex items-center justify-center gap-2 transition-all ${watch('candleType') === type ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-secondary/10 border-border text-muted-foreground hover:bg-secondary/30'}`}>
                                            <input type="radio" value={type} {...register('candleType')} className="hidden" />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground block">Timeframe</label>
                                <select
                                    {...register('timeframe')}
                                    className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="1m">1 Minute</option>
                                    <option value="3m">3 Minute</option>
                                    <option value="5m">5 Minute</option>
                                    <option value="15m">15 Minute</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="1D">1 Day</option>
                                </select>
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 2: LOGIC */}
                {activeTab === 'logic' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                                <h3 className="font-bold flex items-center gap-2"><Zap size={18} /> Entry Conditions</h3>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => append({ indicator: 'RSI', operator: '>', value: 50, params: {} })}
                                    className="text-xs border border-dashed"
                                >
                                    <Plus size={14} className="mr-1" /> Add Rule
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-4 items-start bg-secondary/5 p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">

                                        {/* Row 1: Main Logic */}
                                        <div className="col-span-4 space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Indicator</label>
                                            <select
                                                {...register(`logic.rules.${index}.indicator`)}
                                                className="w-full h-9 px-2 rounded-md bg-card border border-input text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            >
                                                <option value="RSI">RSI</option>
                                                <option value="SMA">SMA</option>
                                                <option value="EMA">EMA</option>
                                                <option value="Supertrend">Supertrend</option>
                                                <option value="PSAR">Parabolic SAR</option>
                                                <option value="Price">Close Price</option>
                                                <option value="Structure">Market Structure (HH/LL)</option>
                                            </select>

                                            {/* Dynamic Params */}
                                            {watch(`logic.rules.${index}.indicator`) === 'Supertrend' && (
                                                <div className="flex gap-2 mt-2">
                                                    <Input type="number" placeholder="Len" {...register(`logic.rules.${index}.params.period`)} defaultValue={14} className="h-7 text-xs" />
                                                    <Input type="number" step="0.1" placeholder="Mul" {...register(`logic.rules.${index}.params.multiplier`)} defaultValue={1.5} className="h-7 text-xs" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-3 space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Condition</label>
                                            <select
                                                {...register(`logic.rules.${index}.operator`)}
                                                className="w-full h-9 px-2 rounded-md bg-card border border-input text-xs font-mono focus:outline-none"
                                            >
                                                <option value=">">Greater (&gt;)</option>
                                                <option value="<">Less (&lt;)</option>
                                                <option value="==">Equals (==)</option>
                                                <option value="CROSS_ABOVE">Crosses Above</option>
                                                <option value="CROSS_BELOW">Crosses Below</option>
                                            </select>
                                        </div>

                                        <div className="col-span-4 space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Value / Reference</label>
                                            {watch(`logic.rules.${index}.indicator`) === 'Structure' ? (
                                                <select {...register(`logic.rules.${index}.value`)} className="w-full h-9 px-2 rounded-md bg-card border border-input text-xs">
                                                    <option value="HH_HL">Bullish (HH + HL)</option>
                                                    <option value="LH_LL">Bearish (LH + LL)</option>
                                                </select>
                                            ) : (
                                                <Input
                                                    type="text"
                                                    placeholder="50 or CLOSE"
                                                    {...register(`logic.rules.${index}.value`)}
                                                    className="h-9 text-xs"
                                                />
                                            )}
                                        </div>

                                        <div className="col-span-1 pt-6 text-center">
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 3: EXECUTION */}
                {activeTab === 'risk' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="p-6 space-y-6">
                            <h3 className="font-bold flex items-center gap-2"><Activity size={18} /> Signal Action</h3>

                            <div className="space-y-4">
                                <label className="text-sm font-medium">What should the bot do?</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${watch('action') === 'BUY' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 ring-1 ring-emerald-500' : 'bg-card border-border hover:bg-accent'}`}>
                                        <input type="radio" value="BUY" {...register('action')} className="hidden" />
                                        <div className="font-bold text-sm">BUY Only</div>
                                        <div className="text-[10px] opacity-70">Long Positions</div>
                                    </label>
                                    <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${watch('action') === 'SELL' ? 'bg-red-500/10 border-red-500 text-red-500 ring-1 ring-red-500' : 'bg-card border-border hover:bg-accent'}`}>
                                        <input type="radio" value="SELL" {...register('action')} className="hidden" />
                                        <div className="font-bold text-sm">SELL Only</div>
                                        <div className="text-[10px] opacity-70">Short Positions</div>
                                    </label>
                                    <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${watch('action') === 'ALERT' ? 'bg-blue-500/10 border-blue-500 text-blue-500 ring-1 ring-blue-500' : 'bg-card border-border hover:bg-accent'}`}>
                                        <input type="radio" value="ALERT" {...register('action')} className="hidden" />
                                        <div className="font-bold text-sm">Any / Both</div>
                                        <div className="text-[10px] opacity-70">Buy & Sell Signals</div>
                                    </label>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 space-y-6">
                            <h3 className="font-bold flex items-center gap-2"><ShieldAlert size={18} /> Risk Management</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Risk Reward Ratio (1:X)"
                                    type="number"
                                    step="0.1"
                                    defaultValue={2}
                                    {...register('risk.riskRewardRatio')}
                                    placeholder="2"
                                />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground block">Stop Loss Type</label>
                                    <select {...register('risk.stopLossType')} className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm">
                                        <option value="Fixed%">Fixed Percentage</option>
                                        <option value="Indicator">Use Supertrend/ATR</option>
                                    </select>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

            </form>
        </div>
    );
};

export default CreateStrategy;