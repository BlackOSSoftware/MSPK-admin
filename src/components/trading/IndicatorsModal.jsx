import React, { useState } from 'react';
import { X, Search, Activity, TrendingUp } from 'lucide-react';

const AVAILABLE_INDICATORS = [
    { id: 'SMA', name: 'Simple Moving Average', type: 'overlay', defaultPeriod: 20, defaultColor: '#f59e0b' }, // Amber
    { id: 'EMA', name: 'Exponential Moving Average', type: 'overlay', defaultPeriod: 9, defaultColor: '#3b82f6' }, // Blue
    { id: 'Supertrend', name: 'Supertrend', type: 'overlay', defaultPeriod: 10, defaultMultiplier: 3, defaultColor: '#10b981' }, // Green/Red dynamic
    { id: 'HHLL', name: 'Higher Highs Lower Lows', type: 'overlay', defaultPeriod: 5, defaultColor: '#ef4444' }, // Markers
    { id: 'RSI', name: 'Relative Strength Index', type: 'separate', defaultPeriod: 14, defaultColor: '#8b5cf6' }, // Violet
    { id: 'PSAR', name: 'Parabolic SAR', type: 'overlay', defaultPeriod: 0.02, defaultColor: '#3b82f6' }, // Blue
    { id: 'VOL', name: 'Volume', type: 'separate', defaultColor: '#26a69a' },
];

const IndicatorsModal = ({ isOpen, onClose, onAddIndicator }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filtered = AVAILABLE_INDICATORS.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-[500px] h-[600px] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-border font-sans text-sm animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
                    <h2 className="text-lg font-bold text-foreground">Indicators</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search indicators..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filtered.map(ind => (
                        <div
                            key={ind.id}
                            onClick={() => {
                                onAddIndicator({ ...ind, period: ind.defaultPeriod, color: ind.defaultColor, uuid: Date.now() });
                                onClose();
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer group transition-colors"
                        >
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Activity size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-foreground">{ind.name}</div>
                                <div className="text-xs text-muted-foreground">Moving Average</div>
                            </div>
                            <button className="px-3 py-1 text-xs font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                Add
                            </button>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No indicators found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IndicatorsModal;
