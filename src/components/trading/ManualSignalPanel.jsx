import React, { useState, useEffect } from 'react';
import { Loader2, Target, X, Plus, Shield, Globe, Lock } from 'lucide-react';
import api from '../../api/client';
import { getSegments } from '../../api/market.api';

const ManualSignalPanel = ({ currentSymbol, currentPrice, currentSegment, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [segments, setSegments] = useState([]);
    const [signal, setSignal] = useState({
        type: 'BUY',
        symbol: currentSymbol || '',
        entryPrice: currentPrice || '',
        stopLoss: '',
        targets: [''],
        notes: '',
        segment: currentSegment || 'EQUITY',
        isFree: false // Default to Premium
    });

    useEffect(() => {
        const loadSegments = async () => {
            try {
                const data = await getSegments();
                setSegments(data);
                if (!currentSegment && data.length > 0) {
                    setSignal(prev => ({ ...prev, segment: data[0].code }));
                }
            } catch (e) { console.error(e); }
        };
        loadSegments();
    }, [currentSegment]);

    const handleTargetChange = (index, value) => {
        const newTargets = [...signal.targets];
        newTargets[index] = value;
        setSignal({ ...signal, targets: newTargets });
    };

    const addTarget = () => {
        if (signal.targets.length < 3) {
            setSignal({ ...signal, targets: [...signal.targets, ''] });
        }
    };

    const removeTarget = (index) => {
        const newTargets = signal.targets.filter((_, i) => i !== index);
        setSignal({ ...signal, targets: newTargets });
    };

    const handleSubmit = async () => {
        if (!signal.entryPrice || !signal.stopLoss || !signal.targets[0]) {
            alert('Please fill Entry, SL and at least Target 1');
            return;
        }

        setLoading(true);
        try {
            // Convert targets array to object {1: val, 2: val}
            const targetsObj = {};
            signal.targets.forEach((t, i) => {
                if (t) targetsObj[`target${i + 1}`] = t;
            });

            const payload = {
                type: signal.type,
                symbol: signal.symbol,
                entryPrice: signal.entryPrice,
                stopLoss: signal.stopLoss,
                targets: targetsObj,
                notes: signal.notes,
                segment: signal.segment,
                isFree: signal.isFree
                // Status defaults to 'Active' in backend model
            };

            await api.post('/signals/manual', payload);
            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to create signal', error);
            alert(error.response?.data?.message || 'Failed to create signal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1e222d] border border-border rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-4 w-80 animate-in fade-in zoom-in-95 pointer-events-auto">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h3 className="font-bold text-sm flex items-center gap-2"><Target size={14} className="text-primary" /> New Signal</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>

            <div className="space-y-4">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setSignal({ ...signal, type: 'BUY' })}
                        className={`py-1.5 rounded text-xs font-bold border transition ${signal.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'}`}
                    >
                        BUY
                    </button>
                    <button
                        onClick={() => setSignal({ ...signal, type: 'SELL' })}
                        className={`py-1.5 rounded text-xs font-bold border transition ${signal.type === 'SELL' ? 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'}`}
                    >
                        SELL
                    </button>
                </div>

                {/* Symbol & Segment */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold">Symbol</label>
                        <input
                            value={signal.symbol}
                            onChange={e => setSignal({ ...signal, symbol: e.target.value })}
                            className="w-full bg-secondary/30 border border-white/10 rounded px-2 py-1.5 text-xs font-mono focus:border-primary/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold">Segment</label>
                        <select
                            value={signal.segment}
                            onChange={e => setSignal({ ...signal, segment: e.target.value })}
                            className="w-full bg-secondary/30 border border-white/10 rounded px-1 py-1.5 text-xs focus:border-primary/50 outline-none appearance-none"
                        >
                            {segments.map(s => <option key={s.code} value={s.code}>{s.name || s.code}</option>)}
                            {segments.length === 0 && <option value="EQUITY">EQUITY</option>}
                        </select>
                    </div>
                </div>

                {/* Entry & Stoploss */}
                <div className="grid grid-cols-2 gap-3 p-2 bg-secondary/20 rounded border border-white/5">
                    <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold">Entry</label>
                        <input
                            type="number"
                            value={signal.entryPrice}
                            onChange={e => setSignal({ ...signal, entryPrice: e.target.value })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs font-mono focus:ring-1 ring-primary/50"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1"><Shield size={10} /> Stoploss</label>
                        <input
                            type="number"
                            value={signal.stopLoss}
                            onChange={e => setSignal({ ...signal, stopLoss: e.target.value })}
                            className="w-full bg-background border border-red-500/30 text-red-400 rounded px-2 py-1 text-xs font-mono focus:ring-1 ring-red-500/50"
                            placeholder="Risk"
                        />
                    </div>
                </div>

                {/* Targets */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1"><Target size={10} /> Targets</label>
                        {signal.targets.length < 3 && (
                            <button onClick={addTarget} className="text-[10px] flex items-center gap-1 text-primary hover:text-primary/80 transition bg-primary/10 px-1.5 py-0.5 rounded">
                                <Plus size={10} /> Add
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {signal.targets.map((tgt, i) => (
                            <div key={i} className="flex gap-1 relative">
                                <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground font-mono">T{i + 1}</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={tgt}
                                    onChange={(e) => handleTargetChange(i, e.target.value)}
                                    className="w-full bg-background border border-emerald-500/20 text-emerald-400 rounded pl-7 pr-2 py-1 text-xs font-mono focus:ring-1 ring-emerald-500/50"
                                />
                                {signal.targets.length > 1 && (
                                    <button onClick={() => removeTarget(i)} className="text-muted-foreground hover:text-red-500 px-1"><X size={12} /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Access & Notes */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <input
                            value={signal.notes}
                            onChange={e => setSignal({ ...signal, notes: e.target.value })}
                            className="w-full bg-secondary/30 border border-white/10 rounded px-2 py-1.5 text-xs h-8 focus:border-primary/50 outline-none"
                            placeholder="Brief note..."
                        />
                    </div>
                    <button
                        onClick={() => setSignal({ ...signal, isFree: !signal.isFree })}
                        className={`col-span-1 rounded border text-[10px] font-bold flex items-center justify-center gap-1 transition ${signal.isFree ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-500'}`}
                        title={signal.isFree ? "Visible to All" : "Paid Users Only"}
                    >
                        {signal.isFree ? <Globe size={10} /> : <Lock size={10} />}
                        {signal.isFree ? 'FREE' : 'PAID'}
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-2.5 rounded bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold hover:from-blue-500 hover:to-blue-400 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                    PUBLISH
                </button>
            </div>
        </div>
    );
};

export default ManualSignalPanel;
