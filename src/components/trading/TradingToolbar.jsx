import React from 'react';
import {
    Crosshair, TrendingUp, Trash2, MousePointer2
} from 'lucide-react';

const ToolIcon = ({ icon: Icon, active, onClick, label }) => (
    <button
        title={label}
        onClick={onClick}
        className={`p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition my-0.5 ${active ? 'text-primary bg-accent/50' : 'text-muted-foreground'}`}
    >
        <Icon size={18} strokeWidth={1.5} />
    </button>
);

const Separator = () => <div className="w-6 h-px bg-border my-1.5 opacity-50" />;

const TradingToolbar = ({ activeTool, onToolChange, onClearDrawings }) => {
    return (
        <div className="flex flex-col items-center py-2 w-full h-full overflow-y-auto no-scrollbar">
            {/* Cursor Tools */}
            <ToolIcon icon={MousePointer2} active={activeTool === 'arrow'} onClick={() => onToolChange('arrow')} label="Arrow" />
            <ToolIcon icon={Crosshair} active={activeTool === 'crosshair'} onClick={() => onToolChange('crosshair')} label="Crosshair" />

            <Separator />

            {/* Drawing Tools */}
            <ToolIcon icon={TrendingUp} active={activeTool === 'line'} onClick={() => onToolChange('line')} label="Trend Line" />

            <Separator />



            {/* Clear */}
            <ToolIcon icon={Trash2} onClick={onClearDrawings} label="Clear All" />
        </div>
    );
};

export default TradingToolbar;
