import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Target, Shield, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';

const schema = yup.object({
    entry: yup.number().typeError('Must be a number').required('Entry is required'),
    stoploss: yup.number().typeError('Must be a number').required('SL is required'),
    target1: yup.number().typeError('Must be a number').required('T1 is required'),
    target2: yup.number().typeError('Must be a number').nullable().transform((v, o) => o === '' ? null : v),
    target3: yup.number().typeError('Must be a number').nullable().transform((v, o) => o === '' ? null : v),
    isFree: yup.boolean()
}).required();

const QuickSignalModal = ({ isOpen, onClose, symbol, type, currentPrice, timeframe, onSuccess }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            entry: currentPrice || 0,
            isFree: false
        }
    });

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const payload = {
                symbol: symbol?.symbol,
                segment: symbol?.segment || 'CASH',
                type: type, // BUY or SELL
                entryPrice: data.entry,
                stopLoss: data.stoploss,
                targets: {
                    target1: data.target1,
                    target2: data.target2 || null,
                    target3: data.target3 || null
                },
                notes: `Quick Signal via Chart`,
                isFree: data.isFree,
                timeframe: timeframe
            };

            const { createSignal } = await import('../../api/signals.api');
            await createSignal(payload);

            toast.success('Signal Published!');
            if (onSuccess) onSuccess();
            onClose();

        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-lg border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className={`px-4 py-3 border-b border-border flex justify-between items-center ${type === 'BUY' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <div>
                        <h2 className={`text-lg font-bold ${type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {type} {symbol?.symbol}
                        </h2>
                        <div className="text-xs text-muted-foreground">Quick Action</div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">

                    {/* Entry Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Entry Price"
                            type="number" step="0.05"
                            {...register('entry')}
                            error={errors.entry?.message}
                            autoFocus
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground block">Access</label>
                            <select
                                {...register('isFree')}
                                className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value={false}>Premium</option>
                                <option value={true}>Free</option>
                            </select>
                        </div>
                    </div>

                    {/* Risk Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                        <Input
                            label="Stop Loss"
                            type="number" step="0.05"
                            {...register('stoploss')}
                            error={errors.stoploss?.message}
                            className="border-red-500/30 focus:border-red-500"
                        />
                        <Input
                            label="Target 1"
                            type="number" step="0.05"
                            {...register('target1')}
                            error={errors.target1?.message}
                            className="border-emerald-500/30 focus:border-emerald-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Target 2"
                            type="number" step="0.05"
                            {...register('target2')}
                            className="text-xs"
                        />
                        <Input
                            label="Target 3"
                            type="number" step="0.05"
                            {...register('target3')}
                            className="text-xs"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSubmitting} className={`flex-1 ${type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            {isSubmitting ? 'Publishing...' : 'Confirm & Publish'}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default QuickSignalModal;
