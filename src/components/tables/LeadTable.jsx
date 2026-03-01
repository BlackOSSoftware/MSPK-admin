import { Eye, CheckCircle, XCircle, AlertTriangle, Edit, Trash2, Calendar, User, Mail, Tag, CreditCard, MapPin, Image, Activity, Settings } from 'lucide-react';
import TableHeaderCell from '../ui/TableHeaderCell';

const LeadTable = ({ leads, onAction, isLoading, highlightTerm }) => {
    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            {/* Table Header Backdrop */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Calendar} label="Date" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={User} label="Name" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={Mail} label="Contact" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Tag} label="Segment" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={CreditCard} label="Plan" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={MapPin} label="City" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Image} label="Screenshot" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Activity} label="Status" align="center" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={Settings} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(10)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-32 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-4 w-24 bg-muted/50 rounded"></div>
                                            <div className="h-3 w-32 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-5 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-6 w-6 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 border-r border-border text-center">
                                        <div className="h-5 w-20 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <div className="h-6 w-6 bg-muted/50 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            leads.map((lead) => {
                                // Date Format
                                const formatDate = (dateString) => {
                                    if (!dateString) return '-';
                                    const d = new Date(dateString);
                                    if (isNaN(d.getTime())) return '-';
                                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                };

                                const isPremium = lead.plan === 'Premium' || (typeof lead.plan === 'string' && lead.plan.includes('Premium'));

                                const isHighlighted = highlightTerm && (
                                    (lead.name && lead.name.toLowerCase().includes(highlightTerm.toLowerCase())) ||
                                    (lead.mobile && lead.mobile.includes(highlightTerm)) ||
                                    (lead.email && lead.email.toLowerCase().includes(highlightTerm.toLowerCase()))
                                );

                                return (
                                    <tr key={lead._id} className={`transition-all duration-500 group relative ${isHighlighted ? '!bg-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] border-y border-yellow-500/20' : 'hover:bg-primary/[0.02]'}`}>
                                        <td className="px-5 py-3 text-muted-foreground font-mono border-r border-border">
                                            {formatDate(lead.createdAt)}
                                        </td>

                                        <td className="px-5 py-3 border-r border-border font-sans">
                                            <span className="text-foreground font-semibold text-xs">{lead.name}</span>
                                        </td>

                                        <td className="px-5 py-3 border-r border-border font-sans">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium text-[11px]">{lead.mobile || lead.phone}</span>
                                                <span className="text-[10px] text-muted-foreground">{lead.email}</span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-3 border-r border-border text-center">
                                            <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                                {lead.segment}
                                            </span>
                                        </td>

                                        <td className="px-5 py-3 border-r border-border text-center">
                                            <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] uppercase font-bold tracking-wider ${isPremium
                                                ? 'border-amber-500/20 text-amber-500 bg-amber-500/5'
                                                : 'border-white/10 text-muted-foreground bg-white/5'
                                                }`}>
                                                {lead.plan}
                                            </span>
                                        </td>

                                        <td className="px-5 py-3 border-r border-border text-muted-foreground">
                                            {lead.city || '-'}
                                        </td>

                                        <td className="px-5 py-3 border-r border-border text-center">
                                            {lead.paymentScreenshot ? (
                                                <button
                                                    onClick={() => onAction('viewImage', lead)}
                                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-all duration-200"
                                                    title="View Screenshot"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground/30 text-[10px]">-</span>
                                            )}
                                        </td>

                                        <td className="px-5 py-3 border-r border-border text-center">
                                            {lead.status === 'CONVERTED' ? (
                                                <span className="flex items-center justify-center gap-1.5 text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                                    <CheckCircle size={10} /> APPROVED
                                                </span>
                                            ) : lead.status === 'REJECTED' ? (
                                                <span className="flex items-center justify-center gap-1.5 text-red-500 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                                    <XCircle size={10} /> REJECTED
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1.5 text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase alert-pulse">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div> PENDING
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {lead.status !== 'CONVERTED' && (
                                                    <button
                                                        title="Approve Lead"
                                                        onClick={() => onAction('approve', lead)}
                                                        className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground rounded-md transition-all duration-200"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                )}

                                                <button
                                                    title="Edit Inquiry"
                                                    onClick={() => onAction('edit', lead)}
                                                    className="p-1.5 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-md transition-all duration-200"
                                                >
                                                    <Edit size={14} />
                                                </button>

                                                <button
                                                    title="Delete Inquiry"
                                                    onClick={() => onAction('delete', lead)}
                                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-all duration-200"
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

export default LeadTable;
