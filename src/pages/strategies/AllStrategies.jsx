import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Trash2, Cpu, Activity, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import { getStrategies, createStrategy, updateStrategy, deleteStrategy } from '../../api/strategies.api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

import StrategyDetailsModal from './StrategyDetailsModal';

const AllStrategies = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStrategy, setSelectedStrategy] = useState(null);

    const fetchStrategies = async () => {
        try {
            const data = await getStrategies();
            setStrategies(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load strategies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategies();
        // Poll every 10 seconds (reduced frequency)
        const interval = setInterval(fetchStrategies, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleStatus = async (strategy) => {
        const strategyId = strategy._id || strategy.id;
        if (!strategyId) return;

        const newStatus = strategy.status === 'Active' ? 'Paused' : 'Active';

        // Optimistic Update
        setStrategies(prev => prev.map(s => {
            const sId = s._id || s.id;
            return sId === strategyId ? { ...s, status: newStatus } : s;
        }));

        try {
            await updateStrategy(strategyId, { status: newStatus });
            toast.success(`Strategy ${newStatus}`);
        } catch (error) {
            // Revert on failure
            setStrategies(prev => prev.map(s => {
                const sId = s._id || s.id;
                return sId === strategyId ? { ...s, status: strategy.status } : s;
            }));
            toast.error('Failed to update status');
        }
    };

    const [deleteId, setDeleteId] = useState(null);

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteStrategy(deleteId);
            toast.success('Strategy deleted');
            fetchStrategies();
        } catch (error) {
            toast.error('Failed to delete strategy');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSeedDemo = async () => {
        try {
            await createStrategy({
                name: 'NIFTY Momentum Bot',
                segment: 'FNO',
                status: 'Paused',
                action: 'BUY',
                type: 'RSI_CROSSOVER',
                symbol: 'NIFTY 50',
                timeframe: '5m',
                logic: {
                    rules: [{
                        indicator: 'RSI',
                        operator: '>',
                        value: 50 // Demo condition
                    }]
                }
            });
            toast.success('Demo Bot Created');
            fetchStrategies();
        } catch (error) {
            toast.error('Failed to create demo bot');
        }
    };

    if (loading) return <div className="p-8 text-center bg-card rounded-xl border border-border shadow-sm m-4 animate-pulse">Loading Engine...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Cpu className="text-primary" /> Strategy Engine
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage automated trading bots</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeedDemo} className="gap-2">
                        <Zap size={16} /> Seed Demo Bot
                    </Button>
                    <Button onClick={() => navigate('/strategies/create')} className="gap-2">
                        <Plus size={16} /> Create Strategy
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                    <Card
                        key={strategy._id || strategy.id}
                        onClick={() => setSelectedStrategy(strategy)}
                        className="p-5 border border-border bg-card hover:border-primary/50 transition-colors group relative overflow-hidden cursor-pointer"
                    >
                        {strategy.status === 'Active' && (
                            <div className="absolute top-0 right-0 p-1">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{strategy.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono uppercase tracking-wider">
                                        {strategy.segment}
                                    </span>
                                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono uppercase tracking-wider">
                                        {strategy.type || 'HYBRID'}
                                    </span>
                                    {strategy.isSystem && (
                                        <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Zap size={10} /> SYSTEM
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`p-2 rounded-full ${strategy.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
                                <Cpu size={20} />
                            </div>
                        </div>

                        <div className="space-y-3 bg-secondary/10 p-3 rounded-lg border border-border/50">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Action</span>
                                <span className={`font-mono font-bold ${strategy.action === 'SELL' ? 'text-red-500' : 'text-emerald-500'}`}>{strategy.action || 'BUY'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Target Symbol</span>
                                <span className="font-mono font-bold">{strategy.symbol || 'N/A'} <span className="text-[10px] text-muted-foreground ml-1">({strategy.timeframe || '5m'})</span></span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Condition</span>
                                <span className="font-mono">
                                    {strategy.logic?.rules?.[0]?.indicator} {strategy.logic?.rules?.[0]?.operator} {strategy.logic?.rules?.[0]?.value}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Signals Generated</span>
                                <span className="font-mono font-bold text-primary">{strategy.stats?.totalSignals || 0}</span>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant={strategy.status === 'Active' ? 'destructive' : 'primary'}
                                className={`flex-1 gap-2 text-xs ${strategy.status === 'Active' ? 'border border-red-500/30' : ''}`}
                                onClick={() => handleToggleStatus(strategy)}
                            >
                                {strategy.status === 'Active' ? <><Pause size={14} /> Running</> : <><Play size={14} /> Start Bot</>}
                            </Button>

                            <Button variant="ghost" className="px-3 text-muted-foreground hover:text-red-500 border border-border/50 hover:border-red-500/30" onClick={() => setDeleteId(strategy._id || strategy.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}

                {strategies.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
                        <div className="inline-flex p-4 rounded-full bg-secondary/50 mb-4">
                            <Activity className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No Strategies Configured</h3>
                        <p className="text-muted-foreground text-sm mt-1 mb-4">Create a bot to start automating your trades.</p>
                        <Button onClick={handleSeedDemo}>Create Demo Bot</Button>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Strategy?"
                message="This action cannot be undone. The bot will be permanently removed and stop trading immediately."
                confirmText="Delete Bot"
                confirmVariant="danger"
            />

            <StrategyDetailsModal
                strategy={selectedStrategy}
                isOpen={!!selectedStrategy}
                onClose={() => setSelectedStrategy(null)}
                onUpdate={(updated) => {
                    setStrategies(prev => prev.map(s => (s._id || s._id) === (updated._id || updated.id) ? updated : s));
                }}
                onDelete={(id) => {
                    setStrategies(prev => prev.filter(s => (s._id || s.id) !== id));
                    setSelectedStrategy(null);
                }}
            />
        </div>
    );
};

export default AllStrategies;
