import React from 'react';
import { X, Calendar, Users, Megaphone, Tag, Activity } from 'lucide-react';
import Button from '../../components/ui/Button';

const AnnouncementDetailsDialog = ({ isOpen, onClose, announcement }) => {
    if (!isOpen || !announcement) return null;

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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayType = (announcement.type === 'REMINDER' || (announcement.type === 'SYSTEM' && announcement.title?.includes('Renewal')))
        ? 'PLAN REMINDER'
        : announcement.type;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Megaphone size={18} />
                        </div>
                        Broadcast Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
                    {/* Header Info */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-xl font-bold text-foreground leading-tight">{announcement.title}</h2>
                            <span className={`px-2.5 py-1 rounded-[4px] text-[10px] uppercase font-bold tracking-wider border whitespace-nowrap ${getTypeColor(announcement.type)}`}>
                                {displayType}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-b border-white/5 pb-6">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-primary/70" />
                                <span>{formatDate(announcement.startDate || announcement.createdAt)}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-primary/70" />
                                    <span className="capitalize">Audience: {announcement.targetAudience?.role === 'sub-broker' ? 'Sub Broker' : (announcement.targetAudience?.role || 'All')}</span>
                                </div>
                                {announcement.targetAudience?.planValues?.length > 0 && (
                                    <div className="flex items-start gap-2 ml-5">
                                        <div className="text-[9px] text-muted-foreground font-bold mt-0.5 whitespace-nowrap">PLANS:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {announcement.targetAudience.planValues.map(p => (
                                                <span key={p} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded border border-primary/10">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {announcement.targetAudience?.segments?.length > 0 && (
                                    <div className="flex items-start gap-2 ml-5">
                                        <div className="text-[9px] text-muted-foreground font-bold mt-0.5 whitespace-nowrap">SEGMENTS:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {announcement.targetAudience.segments.map(s => (
                                                <span key={s} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded border border-amber-500/10">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-primary/70" />
                                <span className="capitalize">Status: <span className="text-foreground">{announcement.status}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Message Body</label>
                        <div className="p-4 rounded-lg bg-secondary/20 border border-white/5 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 font-mono">
                            {announcement.message}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end shrink-0">
                    <Button
                        variant="primary"
                        onClick={onClose}
                        size="sm"
                        className="px-6"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementDetailsDialog;
