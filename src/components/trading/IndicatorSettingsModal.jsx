import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const COLORS = [
    '#2962FF', // Blue
    '#2979FF', // Light Blue
    '#3b82f6', // Tailwind Blue 500
    '#f59e0b', // Amber 500
    '#10b981', // Emerald 500
    '#ef4444', // Red 500
    '#8b5cf6', // Violet 500
    '#ec4899', // Pink 500
    '#ffffff', // White
    '#000000', // Black
];

const SOURCES = [
    { id: 'hl2', label: '(H + L) / 2' },
    { id: 'close', label: 'Close' },
    { id: 'high', label: 'High' },
    { id: 'low', label: 'Low' },
    { id: 'open', label: 'Open' },
    { id: 'hlc3', label: '(H + L + C) / 3' },
    { id: 'ohlc4', label: '(O + H + L + C) / 4' },
];

const IndicatorSettingsModal = ({ isOpen, onClose, indicator, onSave }) => {
    const [settings, setSettings] = useState({ period: 10, color: '#2962FF', lineWidth: 2, multiplier: 3, source: 'hl2' });

    useEffect(() => {
        if (indicator) {
            setSettings({
                period: indicator.period || indicator.defaultPeriod || 10,
                color: indicator.color || indicator.defaultColor || '#2962FF',
                lineWidth: indicator.lineWidth || 2,
                multiplier: indicator.multiplier || indicator.defaultMultiplier || 3,
                source: indicator.source || indicator.defaultSource || 'hl2',
                // HHLL Defaults
                showLabels: indicator.showLabels !== undefined ? indicator.showLabels : true,
                showLines: indicator.showLines !== undefined ? indicator.showLines : true,
                upColor: indicator.upColor || '#10b981',
                downColor: indicator.downColor || '#ef4444'
            });
        }
    }, [indicator, isOpen]);

    if (!isOpen || !indicator) return null;

    const handleSave = () => {
        onSave(indicator.uuid, settings);
        onClose();
    };

    const hasMultiplier = indicator.id === 'Supertrend';
    const hasSource = indicator.id === 'Supertrend' || indicator.id === 'SMA' || indicator.id === 'EMA'; // Can extend to others too

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-[320px] rounded-xl overflow-hidden shadow-2xl border border-border font-sans text-sm animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
                    <h3 className="font-bold text-foreground">Settings: {indicator.name}</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Period Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Length / Period</label>
                        <input
                            type="number"
                            min="1"
                            max="2000"
                            value={settings.period}
                            onChange={(e) => setSettings(prev => ({ ...prev, period: parseInt(e.target.value) || 1 }))}
                            className="w-full bg-background border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>

                    {/* Source Selector */}
                    {hasSource && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Source</label>
                            <select
                                value={settings.source}
                                onChange={(e) => setSettings(prev => ({ ...prev, source: e.target.value }))}
                                className="w-full bg-background border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground appearance-none"
                            >
                                {SOURCES.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Multiplier Input (Conditional) */}
                    {hasMultiplier && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">ATR Multiplier</label>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                max="100"
                                value={settings.multiplier}
                                onChange={(e) => setSettings(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 3 }))}
                                className="w-full bg-background border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            />
                        </div>
                    )}

                    {/* Color Picker */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSettings(prev => ({ ...prev, color: c }))}
                                    className={`w-6 h-6 rounded-full border border-border/50 transition-transform hover:scale-110 ${settings.color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            {/* Custom Color Input */}
                            <input
                                type="color"
                                value={settings.color}
                                onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                                className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Line Width */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Thickness</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(w => (
                                <button
                                    key={w}
                                    onClick={() => setSettings(prev => ({ ...prev, lineWidth: w }))}
                                    className={`flex-1 h-8 rounded border border-border flex items-center justify-center hover:bg-accent ${settings.lineWidth === w ? 'bg-accent text-accent-foreground border-primary/50' : 'bg-background'}`}
                                >
                                    <div style={{ height: w, backgroundColor: 'currentColor', width: '60%' }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HHLL Specific Settings */}
                    {indicator.id === 'HHLL' && (
                        <div className="space-y-4 pt-2 border-t border-border">

                            {/* Show HH/LL Markers */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-foreground">Show HH/LL Labels</label>
                                <input
                                    type="checkbox"
                                    checked={settings.showLabels !== false} // Default true
                                    onChange={(e) => setSettings(prev => ({ ...prev, showLabels: e.target.checked }))}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                            </div>

                            {/* Show ZigZag Lines */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-foreground">Show ZigZag Lines</label>
                                <input
                                    type="checkbox"
                                    checked={settings.showLines !== false} // Default true
                                    onChange={(e) => setSettings(prev => ({ ...prev, showLines: e.target.checked }))}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                            </div>

                            {/* Up Color */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">ZigZag Up Color (Low to High)</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: settings.upColor || '#10b981' }} />
                                    <input
                                        type="color"
                                        value={settings.upColor || '#10b981'}
                                        onChange={(e) => setSettings(prev => ({ ...prev, upColor: e.target.value }))}
                                        className="flex-1 h-8 px-2 bg-background border border-border rounded"
                                    />
                                </div>
                            </div>

                            {/* Down Color */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">ZigZag Down Color (High to Low)</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: settings.downColor || '#ef4444' }} />
                                    <input
                                        type="color"
                                        value={settings.downColor || '#ef4444'}
                                        onChange={(e) => setSettings(prev => ({ ...prev, downColor: e.target.value }))}
                                        className="flex-1 h-8 px-2 bg-background border border-border rounded"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border bg-muted/10 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded flex items-center gap-1.5">
                        <Check size={12} />
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IndicatorSettingsModal;