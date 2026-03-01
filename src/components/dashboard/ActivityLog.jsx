import React from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityLog = ({ logs = [] }) => {
    const getInitials = (log) => {
        const base = log.user || log.name || log.email || log.msg || 'MS';
        const clean = String(base).replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
        const parts = clean.split(/\s+/).filter(Boolean);
        if (!parts.length) return 'MS';
        return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
    };

    const getAvatarStyle = (type) => {
        switch (type) {
            case 'login': return 'bg-emerald-500/10 text-emerald-600';
            case 'sub': return 'bg-indigo-500/10 text-indigo-600';
            case 'user': return 'bg-sky-500/10 text-sky-600';
            case 'ticket': return 'bg-amber-500/10 text-amber-600';
            default: return 'bg-primary/10 text-primary';
        }
    };

    return (
        <div className="dashboard-surface soft-shadow soft-shadow-hover h-full bg-card/90 border border-border/70 rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
            <div className="h-10 sm:h-11 shrink-0 border-b border-border/70 px-3 sm:px-4 flex items-center justify-between bg-secondary/30">
                <h3 className="text-[10px] sm:text-[11px] font-semibold text-foreground uppercase tracking-[0.2em]">Live Activity</h3>
                <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-emerald-600 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {logs.length > 0 ? logs.map((log) => (
                    <div key={log.id} className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-primary/5 border border-transparent hover:border-border/70 transition-all cursor-default">
                        <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-semibold ${getAvatarStyle(log.type)}`}>
                            {getInitials(log)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                {log.msg}
                            </p>
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground/50 font-medium flex items-center gap-1">
                                <Clock size={8} className="sm:hidden" />
                                <Clock size={9} className="hidden sm:block" />
                                {formatDistanceToNow(new Date(log.time || Date.now()), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">No recent activity.</div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
