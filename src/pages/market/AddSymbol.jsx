import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Save, X, BarChart2, Settings, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import useToast from '../../hooks/useToast';
import { createSymbol, getSegments, searchInstruments } from '../../api/market.api';

const schema = yup.object({
    symbol: yup.string().required('Symbol is required').uppercase(),
    name: yup.string().required('Description/Name is required'),
    segment: yup.string().required('Segment is required'),
    exchange: yup.string().required('Exchange is required'),
    lotSize: yup.number().positive().integer().typeError('Lot Size must be a number').required('Lot Size is required'),
    tickSize: yup.number().positive().typeError('Tick Size must be a number').required('Tick Size is required'), // Added Tick Size
}).required();

const AddSymbol = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [segments, setSegments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            lotSize: 1,
            tickSize: 0.05
        }
    });

    const [symbolSearch, setSymbolSearch] = useState('');
    const [symbolOptions, setSymbolOptions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Watch symbol to fetch details or handle selection
    const selectedSymbolValue = watch('symbol');

    useEffect(() => {
        const fetchSuggested = async () => {
            if (symbolSearch.length === 0) {
                // Reset to initial symbols if search cleared
                const results = await searchInstruments('');
                setSymbolOptions(results.map(r => ({
                    label: `${r.symbol} - ${r.name}`,
                    value: r.symbol,
                    raw: r
                })));
                return;
            }
            if (symbolSearch.length < 2) return;

            setIsSearching(true);
            try {
                const results = await searchInstruments(symbolSearch);
                setSymbolOptions(results.map(r => ({
                    label: `${r.symbol} - ${r.name}`,
                    value: r.symbol,
                    raw: r
                })));
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchSuggested, 500);
        return () => clearTimeout(timer);
    }, [symbolSearch]);

    const handleSymbolSelect = (symValue) => {
        const option = symbolOptions.find(o => o.value === symValue);
        if (option && option.raw) {
            const { raw } = option;
            setValue('symbol', raw.symbol);
            setValue('name', raw.name);
            setValue('segment', raw.segment);
            setValue('exchange', raw.exchange);
            setValue('lotSize', raw.lotSize);
            setValue('tickSize', raw.tickSize);
        } else {
            setValue('symbol', symValue);
        }
    };

    useEffect(() => {
        const loadSegments = async () => {
            try {
                const data = await getSegments();
                setSegments(data);
            } catch (error) {
                console.error("Failed to load segments", error);
                toast.error("Failed to load segments");
            }
        };

        const loadInitialSymbols = async () => {
            setIsSearching(true);
            try {
                const results = await searchInstruments('');
                setSymbolOptions(results.map(r => ({
                    label: `${r.symbol} - ${r.name}`,
                    value: r.symbol,
                    raw: r
                })));
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };

        loadSegments();
        loadInitialSymbols();
    }, []);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await createSymbol({ ...data, isActive: true });
            toast.success("Symbol added successfully");
            navigate('/market/symbols');
        } catch (error) {
            console.error("Failed to add symbol", error);
            const msg = error.response?.data?.message || "Failed to add symbol";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Add Market Instrument</h1>
                    <p className="text-muted-foreground text-sm mt-1">Configure new trading symbol for the platform</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/market/symbols')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Section 1: Basic Info */}
                <Card className="p-6 space-y-6 overflow-visible relative z-20">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <BarChart2 size={18} className="text-primary" /> Instrument Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Find Instrument (Search & Select)</label>
                            <div className="relative">
                                <Controller
                                    name="symbol"
                                    control={control}
                                    render={({ field }) => (
                                        <SearchableSelect
                                            options={symbolOptions}
                                            value={field.value}
                                            onChange={(val) => {
                                                field.onChange(val);
                                                handleSymbolSelect(val);
                                            }}
                                            placeholder="Type to search (e.g. NIFTY, RELIANCE)..."
                                            searchPlaceholder="Search instruments..."
                                            variant="standard"
                                            onSearchChange={setSymbolSearch}
                                            allowCustom={true} // Enabled Manual Entry
                                        />
                                    )}
                                />
                                {isSearching && <div className="absolute right-10 top-3 animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Format: EXCHANGE:SYMBOL-SERIES (e.g. NSE:SBIN-EQ). Searching will auto-fill other fields.</p>
                            {errors.symbol && <p className="text-xs text-red-500">{errors.symbol.message}</p>}
                        </div>

                        <Input
                            label="Full Name / Description"
                            placeholder="e.g. Reliance Industries Ltd"
                            {...register('name')}
                            error={errors.name?.message}
                        />
                    </div>
                </Card>

                {/* Section 2: Trading Config */}
                <Card className="p-6 space-y-6 overflow-visible">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Settings size={18} className="text-primary" /> Trading Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Segment</label>
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Exchange</label>
                            <Controller
                                name="exchange"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={[
                                            { label: 'NSE', value: 'NSE' },
                                            { label: 'BSE', value: 'BSE' },
                                            { label: 'MCX', value: 'MCX' },
                                            { label: 'CDS', value: 'CDS' },
                                            { label: 'NFO', value: 'NFO' },
                                            { label: 'BFO', value: 'BFO' }
                                        ]}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Exchange..."
                                        searchable={false}
                                        variant="standard"
                                    />
                                )}
                            />
                            {errors.exchange && <p className="text-xs text-red-500">{errors.exchange.message}</p>}
                        </div>

                        <Input
                            label="Lot Size"
                            type="number"
                            placeholder="1"
                            {...register('lotSize')}
                            error={errors.lotSize?.message}
                        />

                        <Input
                            label="Tick Size"
                            type="number"
                            step="0.05"
                            placeholder="0.05"
                            {...register('tickSize')}
                            error={errors.tickSize?.message}
                        />
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => navigate('/market/symbols')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting} className="min-w-[150px] gap-2">
                        {isSubmitting ? 'Saving...' : <><Save size={16} /> Save Instrument</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddSymbol;
