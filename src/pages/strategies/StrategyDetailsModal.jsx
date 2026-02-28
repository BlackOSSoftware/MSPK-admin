import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Trash2, Save, Activity, Cpu, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { updateStrategy, deleteStrategy } from '../../api/strategies.api';
import useToast from '../../hooks/useToast';

const StrategyDetailsModal = ({ strategy, isOpen, onClose, onUpdate, onDelete }) => {
    const toast = useToast();
    const [editedStrategy, setEditedStrategy] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (strategy) {
            setEditedStrategy(JSON.parse(JSON.stringify(strategy))); // Deep copy
        }
    }, [strategy]);

    if (!isOpen || !strategy || !editedStrategy) return null;

    const handleSave = async () => {
        try {
            await updateStrategy(editedStrategy._id || editedStrategy.id, editedStrategy);
            toast.success('Strategy updated successfully');
            onUpdate(editedStrategy);
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update strategy');
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = editedStrategy.status === 'Active' ? 'Paused' : 'Active';
        try {
            await updateStrategy(editedStrategy._id || editedStrategy.id, { status: newStatus });
            setEditedStrategy(prev => ({ ...prev, status: newStatus }));
            onUpdate({ ...editedStrategy, status: newStatus });
            toast.success(`Strategy ${newStatus}`);
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this strategy?')) {
            try {
                await deleteStrategy(editedStrategy._id || editedStrategy.id);
                toast.success('Strategy deleted');
                onDelete(editedStrategy._id || editedStrategy.id);
                onClose();
            } catch (error) {
                toast.error('Failed to delete strategy');
            }
        }
    };

    const updateRuleParam = (ruleIndex, paramKey, value) => {
        setEditedStrategy(prev => {
            const next = { ...prev };
            if (!next.logic) next.logic = { rules: [] };
            if (!next.logic.rules[ruleIndex]) return next;

            if (!next.logic.rules[ruleIndex].params) next.logic.rules[ruleIndex].params = {};
            next.logic.rules[ruleIndex].params[paramKey] = value;
            return next;
        });
    };

    const updateTopLevel = (key, value) => {
        setEditedStrategy(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editedStrategy.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            <Cpu size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editedStrategy.name}
                                {editedStrategy.isSystem && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                                        <Activity size={10} /> System
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                {editedStrategy._id} • <span className={`font-mono ${editedStrategy.status === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>{editedStrategy.status}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Basic Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Target Symbol"
                            value={editedStrategy.symbol}
                            onChange={(e) => updateTopLevel('symbol', e.target.value)}
                            disabled={!isEditing}
                        />
                        {editedStrategy.isSystem ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground block">Active Timeframes</label>
                                <div className="flex flex-wrap gap-1">
                                    {['5m', '15m', '30m', '1h', '4h', '1D'].map(tf => (
                                        <span key={tf} className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                                            {tf}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Input
                                label="Timeframe"
                                value={editedStrategy.timeframe}
                                onChange={(e) => updateTopLevel('timeframe', e.target.value)}
                                disabled={!isEditing}
                            />
                        )}
                        <Input
                            label="Action"
                            value={editedStrategy.action}
                            onChange={(e) => updateTopLevel('action', e.target.value)}
                            disabled={!isEditing}
                        />
                        <Input
                            label="Segment"
                            value={editedStrategy.segment}
                            onChange={(e) => updateTopLevel('segment', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Logic Editor */}
                    <div className="border border-border rounded-lg p-4 bg-secondary/5">
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <Activity size={16} /> Strategy Logic
                        </h3>

                        {editedStrategy.logic?.rules?.map((rule, idx) => (
                            <div key={idx} className="space-y-3 p-3 bg-card rounded border border-border">
                                <div className="flex justify-between items-center text-xs font-mono font-bold text-muted-foreground mb-2">
                                    <span>RULE #{idx + 1}: {rule.indicator}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {rule.indicator === 'Supertrend' && (
                                        <>
                                            <Input
                                                label="Period"
                                                type="number"
                                                value={rule.params?.period || 10}
                                                onChange={(e) => updateRuleParam(idx, 'period', parseFloat(e.target.value))}
                                                disabled={!isEditing}
                                            />
                                            <Input
                                                label="Multiplier"
                                                type="number"
                                                value={rule.params?.multiplier || 3}
                                                onChange={(e) => updateRuleParam(idx, 'multiplier', parseFloat(e.target.value))}
                                                disabled={!isEditing}
                                            />
                                        </>
                                    )}
                                    {rule.indicator === 'RSI' && (
                                        <Input
                                            label="Threshold"
                                            type="number"
                                            value={rule.value || 50}
                                            // onChange logic needed for value
                                            disabled={!isEditing}
                                        />
                                    )}
                                </div>
                                <div className="text-xs bg-secondary p-2 rounded text-muted-foreground mt-2">
                                    Actual logic flow: Calculate {rule.indicator}({JSON.stringify(rule.params)}) &rarr; check {rule.operator} {rule.value}
                                </div>
                            </div>
                        ))}

                        {!editedStrategy.logic?.rules?.length && (
                            <div className="text-sm text-muted-foreground italic">No specific rules defined in DB logic. Using Hybrid Service default.</div>
                        )}
                    </div>

                    {/* Detailed Logic Explanation (Static/Dynamic) */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h3 className="font-bold text-primary flex items-center gap-2 mb-2 text-sm">
                            <AlertTriangle size={16} /> How it works (Heikin Ashi)
                        </h3>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                            <li><strong>Candles:</strong> Heikin Ashi calculated from Market Ticks.</li>
                            <li><strong>Evaluation:</strong> Runs on CLOSE of every candle for {editedStrategy.isSystem ? 'Active Timeframes' : editedStrategy.timeframe}.</li>
                            <li><strong>Entry Rule:</strong> 2-Candle Confirmation (Trend Flip + Confirmation Candle).</li>
                            <li><strong>Filters:</strong> Wick Validation (Upper/Lower Pressure) + Supertrend Flip.</li>
                            <li><strong>Execution:</strong> Signal triggers on the OPEN of 3rd candle.</li>
                            <li><strong>Target:</strong> Dynamic 1:2 Risk-Reward based on Supertrend SL.</li>
                        </ul>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-secondary/10 flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-none"
                            onClick={handleDelete}
                        >
                            <Trash2 size={18} /> Delete
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleToggleStatus}
                            className={editedStrategy.status === 'Active' ? 'text-red-500' : 'text-emerald-500'}
                        >
                            {editedStrategy.status === 'Active' ? <><Pause size={18} className="mr-2" /> Stop Bot</> : <><Play size={18} className="mr-2" /> Start Bot</>}
                        </Button>

                        {isEditing ? (
                            <Button onClick={handleSave} className="gap-2">
                                <Save size={18} /> Save Changes
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                Edit Configuration
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrategyDetailsModal;
