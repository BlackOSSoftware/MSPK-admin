import React from 'react';
import { UserPlus, Send, Settings, AlertTriangle, ShieldAlert, BadgePlus } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const ACTION_BUTTONS = [
    { icon: UserPlus, label: 'Add User', color: 'hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/30', path: '/users/create' },
    { icon: BadgePlus, label: 'New Plan', color: 'hover:bg-amber-500/20 hover:text-amber-500 hover:border-amber-500/30', path: '/plans/create' },
    { icon: Send, label: 'Broadcast', color: 'hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500/30', path: '/announcements/create' },
    { icon: ShieldAlert, label: 'Audit Log', color: 'hover:bg-purple-500/20 hover:text-purple-500 hover:border-purple-500/30', path: '/reports/all' },
    { icon: AlertTriangle, label: 'Sys Freeze', color: 'hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30', path: '/settings/all' }, // Redirect to settings for now
    { icon: Settings, label: 'Config', color: 'hover:bg-purple-500/20 hover:text-purple-500 hover:border-purple-500/30', path: '/settings/all' },
];

const QuickActions = () => {
    const navigate = useNavigate();
    return (
        <div className="bg-card border border-border rounded-xl shadow-xl flex flex-col overflow-hidden h-full relative group hover:border-primary/50 transition-all duration-500">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="h-9 shrink-0 border-b border-border px-3 flex items-center justify-between bg-accent/5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Actions</span>
            </div>
            <div className="p-2 grid grid-cols-3 gap-2 flex-1">
                {ACTION_BUTTONS.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(btn.path)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-transparent bg-accent/5 transition-all duration-200 group ${btn.color}`}
                    >
                        <btn.icon size={16} className="text-muted-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-medium text-muted-foreground/80 group-hover:text-inherit">{btn.label}</span>
                    </button>
                ))}
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
};

export default QuickActions;
