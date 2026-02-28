import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, X, BarChart2, Settings, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import useToast from '../../hooks/useToast';
import { updateSymbol, getSegments } from '../../api/market.api';

const schema = yup.object({
    symbol: yup.string().required('Symbol is required').uppercase(),
    name: yup.string().required('Description/Name is required'),
    segment: yup.string().required('Segment is required'),
    exchange: yup.string().required('Exchange is required'),
    lotSize: yup.number().positive().integer().typeError('Lot Size must be a number').required('Lot Size is required'),
    tickSize: yup.number().positive().typeError('Tick Size must be a number').required('Tick Size is required'),
    isActive: yup.boolean()
}).required();

const EditSymbol = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [segments, setSegments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get symbol from state
    const symbolToEdit = location.state?.symbol;

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            symbol: '',
            name: '',
            segment: '',
            exchange: '',
            lotSize: 1,
            tickSize: 0.05,
            isActive: true
        }
    });

    useEffect(() => {
        if (!symbolToEdit) {
            toast.error("No symbol selected for editing");
            navigate('/market/symbols');
            return;
        }

        // Pre-fill form
        reset({
            symbol: symbolToEdit.symbol,
            name: symbolToEdit.name,
            segment: symbolToEdit.segment,
            exchange: symbolToEdit.exchange,
            lotSize: symbolToEdit.lotSize,
            tickSize: symbolToEdit.tickSize || 0.05,
            isActive: symbolToEdit.isActive
        });

        const loadSegments = async () => {
            try {
                const data = await getSegments();
                setSegments(data);
            } catch (error) {
                console.error("Failed to load segments", error);
                toast.error("Failed to load segments");
            }
        };
        loadSegments();
    }, [symbolToEdit, navigate, reset, toast]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await updateSymbol(symbolToEdit._id, data);
            toast.success("Symbol updated successfully");
            navigate('/market/symbols');
        } catch (error) {
            console.error("Failed to update symbol", error);
            const msg = error.response?.data?.message || "Failed to update symbol";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!symbolToEdit) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Edit Instrument</h1>
                    <p className="text-muted-foreground text-sm mt-1">Modify details for {symbolToEdit.symbol}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/market/symbols')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Section 1: Basic Info */}
                <Card className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <BarChart2 size={18} className="text-primary" /> Instrument Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Symbol Code"
                            placeholder="e.g. RELIANCE"
                            {...register('symbol')}
                            error={errors.symbol?.message}
                            className="uppercase font-mono"
                            disabled // Symbol code locked
                        />

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

                {/* Section 3: Status */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                        <Activity size={18} className="text-primary" /> Status & Visibility
                    </h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="bg-secondary border-border rounded w-5 h-5 text-primary focus:ring-primary/50 cursor-pointer"
                            {...register('isActive')}
                        />
                        <div>
                            <label htmlFor="isActive" className="text-sm font-bold text-foreground cursor-pointer">Active for Trading</label>
                            <p className="text-xs text-muted-foreground">If unchecked, this symbol will not appear in the frontend watchlist.</p>
                        </div>
                    </div>
                </Card>


                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => navigate('/market/symbols')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting} className="min-w-[150px] gap-2">
                        {isSubmitting ? 'Updating...' : <><Save size={16} /> Update Instrument</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditSymbol;
