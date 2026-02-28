import React from 'react';
import { Clock, Shield, User, Wallet, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityLog = ({ logs = [] }) => {
    // Map log types to icons/colors dynamically if needed, or rely on backend to send type
    const getIcon = (type) => {
        switch (type) {
            case 'login': return { icon: Shield, color: 'text-emerald-500' };
            case 'sub': return { icon: Wallet, color: 'text-amber-500' };
            case 'user': return { icon: User, color: 'text-blue-500' };
            case 'ticket': return { icon: Activity, color: 'text-purple-500' };
            default: return { icon: Activity, color: 'text-white/50' };
        }
    };

    return (
        <div className="h-full bg-card border border-border rounded-xl shadow-xl flex flex-col overflow-hidden relative group hover:border-primary/50 transition-all duration-500">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="h-10 shrink-0 border-b border-border px-3 flex items-center justify-between bg-accent/5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-primary" /> Live Activity
                </h3>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {logs.length > 0 ? logs.map((log) => {
                    const { icon: Icon, color } = getIcon(log.type);
                    return (
                        <div key={log.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent/5 border border-transparent hover:border-border transition-all cursor-default">
                            <div className={`mt-0.5 shrink-0 ${color}`}>
                                <Icon size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    {log.msg}
                                </p>
                                <span className="text-[9px] text-muted-foreground/40 font-mono flex items-center gap-1">
                                    <Clock size={8} /> {formatDistanceToNow(new Date(log.time), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">No recent activity.</div>
                )}
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
};

export default ActivityLog;
