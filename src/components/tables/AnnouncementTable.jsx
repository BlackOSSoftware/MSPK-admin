import React from 'react';
import { MoreVertical, Megaphone, Calendar, Users, Eye, Edit, Trash2, Tag, Activity, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import TableHeaderCell from '../ui/TableHeaderCell';

const AnnouncementTable = ({ announcements, onAction, isLoading, highlightTerm }) => {
    const getTypeColor = (type) => {
        switch (type?.toUpperCase()) {
            case 'URGENT': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'UPDATE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'EVENT': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'SYSTEM': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'NEWS': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'SIGNAL': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'ECONOMIC': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
            case 'REMINDER': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-muted-foreground bg-muted/10 border-border';
        }
    };

    const getStatusColor = (status) => {
        switch (status) { // Virtual status is capitalized Active/Scheduled/Expired/Disabled
            case 'Active': return 'text-emerald-500';
            case 'Scheduled': return 'text-amber-500';
            case 'Expired': return 'text-muted-foreground';
            case 'Disabled': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDisplayType = (item) => {
        if (item.type === 'REMINDER') return 'PLAN REMINDER';
        // Handle legacy/fallback system alerts that are actually reminders
        if (item.type === 'SYSTEM' && item.title?.includes('Renewal')) return 'PLAN REMINDER';
        return item.type;
    };

    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Megaphone} label="Title" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Tag} label="Type" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Users} label="Audience" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Activity} label="Status" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Calendar} label="Date" align="center" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={Settings} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-muted/50"></div>
                                            <div className="flex flex-col gap-1">
                                                <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                                <div className="h-3 w-48 bg-muted/50 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <div className="h-5 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (

                            announcements.map((item, index) => {
                                const isHighlighted = highlightTerm && (
                                    (item.title && item.title.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (item.message && item.message.toLowerCase().includes(highlightTerm.toLowerCase()))
                                );

                                return (
                                    <tr key={item.id || index} className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}>
                                        <td className="px-5 py-3 border-r border-border">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-secondary/30 flex items-center justify-center text-muted-foreground border border-white/5">
                                                    <Megaphone size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-foreground font-bold">{item.title}</div>
                                                    <div className="text-[9px] text-muted-foreground truncate w-40">{item.message}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={clsx("px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider", getTypeColor(item.type))}>
                                                {getDisplayType(item)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={10} />
                                                    <span className="capitalize leading-none">{item.targetAudience?.role === 'sub-broker' ? 'Sub Broker' : (item.targetAudience?.role || 'All')}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {item.targetAudience?.planValues?.length > 0 && (
                                                        <span className="text-[8px] px-1 bg-primary/10 text-primary rounded-sm font-bold border border-primary/10">
                                                            {item.targetAudience.planValues.length} PLANS
                                                        </span>
                                                    )}
                                                    {item.targetAudience?.segments?.length > 0 && (
                                                        <span className="text-[8px] px-1 bg-amber-500/10 text-amber-500 rounded-sm font-bold border border-amber-500/10">
                                                            {item.targetAudience.segments.length} SEGMENTS
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border">
                                            <span className={clsx("font-bold uppercase tracking-wider text-[10px]", getStatusColor(item.status))}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Calendar size={12} />
                                                <span>{formatDate(item.startDate || item.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {/* View Action */}
                                                <button
                                                    onClick={() => onAction('view', item)}
                                                    className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground rounded-md transition-all duration-200"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>


                                                <button
                                                    onClick={() => onAction('delete', item)}
                                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-all duration-200"
                                                    title="Delete Announcement"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AnnouncementTable;
