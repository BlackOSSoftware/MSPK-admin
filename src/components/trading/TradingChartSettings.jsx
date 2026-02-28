import React, { useState } from 'react';
import {
    X,
    CandlestickChart,
    AlignLeft,
    Ruler,
    Brush,
    TrendingUp,
    Bell,
    Calendar,
    CheckSquare,
    Square,
    Info,
    ChevronDown
} from 'lucide-react';

const TradingChartSettings = ({ isOpen, onClose, onApply, chartType, onChartTypeChange, settings, onSettingsChange }) => {
    const [activeTab, setActiveTab] = useState('Symbol');

    if (!isOpen) return null;

    const tabs = [
        { id: 'Symbol', icon: CandlestickChart, label: 'Symbol' },
        { id: 'Scales', icon: Ruler, label: 'Scales' },
        { id: 'Canvas', icon: Brush, label: 'Canvas' },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-[800px] h-[90vh] md:h-[550px] flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl border border-border font-sans text-sm animate-in fade-in zoom-in-95 duration-200">

                {/* Left Sidebar */}
                <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border bg-muted/10 flex flex-row md:flex-col overflow-x-auto flex-none items-center md:items-stretch">
                    <div className="p-4 text-lg font-bold text-foreground whitespace-nowrap hidden md:block">Settings</div>
                    <div className="flex flex-row md:flex-col gap-0.5 px-2 w-full md:w-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${activeTab === tab.id
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col bg-card">
                    {/* Header (Close Button) */}
                    <div className="flex justify-end p-4">
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-8 pb-8">
                        {activeTab === 'Canvas' && (
                            <div className="flex flex-col gap-6">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Chart Basic Styles</h3>

                                {/* Background */}
                                <div className="flex items-center justify-between">
                                    <span className="text-foreground">Background</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={settings.canvas.backgroundType}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, canvas: { ...prev.canvas, backgroundType: e.target.value } }))}
                                            className="bg-background border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="solid">Solid</option>
                                            <option value="gradient">Gradient</option>
                                        </select>
                                        <div className="relative w-8 h-8 rounded border border-border bg-background cursor-pointer overflow-hidden">
                                            <input
                                                type="color"
                                                value={settings.canvas.backgroundColor}
                                                onChange={(e) => onSettingsChange(prev => ({ ...prev, canvas: { ...prev.canvas, backgroundColor: e.target.value } }))}
                                                className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Grid lines */}
                                <div className="flex items-center justify-between">
                                    <span className="text-foreground">Grid lines</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={settings.canvas.gridVertLines && settings.canvas.gridHorzLines ? 'both' : (settings.canvas.gridVertLines ? 'vert' : (settings.canvas.gridHorzLines ? 'horz' : 'none'))}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                onSettingsChange(prev => ({
                                                    ...prev,
                                                    canvas: {
                                                        ...prev.canvas,
                                                        gridVertLines: val === 'both' || val === 'vert',
                                                        gridHorzLines: val === 'both' || val === 'horz'
                                                    }
                                                }));
                                            }}
                                            className="bg-background border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="both">Vert and horz</option>
                                            <option value="vert">Vert only</option>
                                            <option value="horz">Horz only</option>
                                            <option value="none">None</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Scales' && (
                            <div className="flex flex-col gap-6">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Price Scale</h3>
                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => onSettingsChange(prev => ({ ...prev, scales: { ...prev.scales, showLastPrice: !prev.scales.showLastPrice } }))}
                                        className={`w-5 h-5 flex items-center justify-center border border-border rounded cursor-pointer ${settings.scales.showLastPrice ? 'bg-primary border-primary' : 'hover:border-primary'}`}
                                    >
                                        {settings.scales.showLastPrice && <CheckSquare size={16} className="text-primary-foreground" />}
                                    </div>
                                    <span className="text-foreground">Symbol last price label</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => onSettingsChange(prev => ({ ...prev, scales: { ...prev.scales, showSymbolName: !prev.scales.showSymbolName } }))}
                                        className={`w-5 h-5 flex items-center justify-center border border-border rounded cursor-pointer ${settings.scales.showSymbolName ? 'bg-primary border-primary' : 'hover:border-primary'}`}
                                    >
                                        {settings.scales.showSymbolName && <CheckSquare size={16} className="text-primary-foreground" />}
                                    </div>
                                    <span className="text-foreground">Symbol name label</span>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Symbol' && (
                            <div className="flex flex-col gap-6">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Candles</h3>

                                {/* Body Color */}
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-primary rounded flex items-center justify-center cursor-pointer text-primary-foreground">
                                        <CheckSquare size={16} fill="currentColor" className="text-background" />
                                    </div>
                                    <span className="text-foreground w-24">Body</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.symbol.upColor}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, symbol: { ...prev.symbol, upColor: e.target.value } }))}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <input
                                            type="color"
                                            value={settings.symbol.downColor}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, symbol: { ...prev.symbol, downColor: e.target.value } }))}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Borders Color */}
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-primary rounded flex items-center justify-center cursor-pointer text-primary-foreground">
                                        <CheckSquare size={16} fill="currentColor" className="text-background" />
                                    </div>
                                    <span className="text-foreground w-24">Borders</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.symbol.borderUpColor}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, symbol: { ...prev.symbol, borderUpColor: e.target.value } }))}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <input
                                            type="color"
                                            value={settings.symbol.borderDownColor}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, symbol: { ...prev.symbol, borderDownColor: e.target.value } }))}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Wick Color */}
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-primary rounded flex items-center justify-center cursor-pointer text-primary-foreground">
                                        <CheckSquare size={16} fill="currentColor" className="text-background" />
                                    </div>
                                    <span className="text-foreground w-24">Wick</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.symbol.wickUpColor}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, symbol: { ...prev.symbol, wickUpColor: e.target.value } }))}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <input
                                            type="color"
                                            value={settings.symbol.wickDownColor}
                                            onChange={(e) => onSettingsChange(prev => ({ ...prev, symbol: { ...prev.symbol, wickDownColor: e.target.value } }))}
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border flex items-center justify-end bg-muted/5">
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="px-5 py-2 rounded border border-border hover:bg-muted transition text-foreground">
                                Cancel
                            </button>
                            <button onClick={() => { onApply?.(); onClose(); }} className="px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium shadow-sm">
                                Ok
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TradingChartSettings;
