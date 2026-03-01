import React from 'react';
import { UserPlus, Send, Settings, AlertTriangle, BadgePlus } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const ACTION_BUTTONS = [
    { icon: UserPlus, label: 'Add User', color: 'hover:text-blue-600', path: '/users/create' },
    { icon: BadgePlus, label: 'New Plan', color: 'hover:text-amber-600', path: '/plans/create' },
    { icon: Send, label: 'Broadcast', color: 'hover:text-emerald-600', path: '/announcements/create' },
    { icon: AlertTriangle, label: 'Sys Freeze', color: 'hover:text-rose-600', path: '/settings/all' }, // Redirect to settings for now
    { icon: Settings, label: 'Config', color: 'hover:text-slate-600', path: '/settings/all' },
];

const QuickActions = () => {
    const navigate = useNavigate();
    return (
        <div className="dashboard-surface soft-shadow soft-shadow-hover bg-card/90 border border-border/70 rounded-2xl flex flex-col overflow-hidden h-full transition-all duration-300">
            <div className="h-11 shrink-0 border-b border-border/70 px-4 flex items-center justify-between bg-secondary/30">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">Quick Actions</span>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2 flex-1">
                {ACTION_BUTTONS.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(btn.path)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10 transition-all duration-200 group ${btn.color}`}
                    >
                        <btn.icon size={16} className="text-muted-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-medium text-muted-foreground/80 group-hover:text-foreground">{btn.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
