import React from 'react';
import { Calendar, Edit, Trash2, FileText, Eye } from 'lucide-react';
import TableHeaderCell from '../ui/TableHeaderCell';

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const BlogTable = ({ blogs, onAction, isLoading }) => {
    return (
        <div className="terminal-panel w-full h-full overflow-hidden border border-border bg-card rounded-lg shadow-2xl relative flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-muted/50 sticky top-0 z-10 uppercase tracking-widest text-[9px] font-bold text-muted-foreground border-b border-border shadow-sm backdrop-blur-md">
                        <tr>
                            <TableHeaderCell className="px-5 py-3 border-r border-border bg-muted/90 backdrop-blur-sm" icon={FileText} label="Title" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={Calendar} label="Published" align="center" />
                            <TableHeaderCell className="px-5 py-3 border-r border-border text-center bg-muted/90 backdrop-blur-sm" icon={FileText} label="Status" align="center" />
                            <TableHeaderCell className="px-5 py-3 text-center bg-muted/90 backdrop-blur-sm" icon={FileText} label="Actions" align="center" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent text-[11px] font-medium font-mono">
                        {isLoading ? (
                            [...Array(8)].map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-muted/50"></div>
                                            <div className="flex flex-col gap-1">
                                                <div className="h-4 w-36 bg-muted/50 rounded"></div>
                                                <div className="h-3 w-48 bg-muted/50 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <div className="h-4 w-24 bg-muted/50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <div className="h-4 w-16 bg-muted/50 rounded mx-auto"></div>
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
                            blogs.map((item) => (
                                <tr key={item._id} className="transition-all duration-500 group relative hover:bg-primary/[0.02]">
                                    <td className="px-5 py-3 border-r border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-secondary/30 flex items-center justify-center text-muted-foreground border border-white/5">
                                                <FileText size={14} />
                                            </div>
                                            <div>
                                                <div className="text-foreground font-bold">{item.title}</div>
                                                <div className="text-[9px] text-muted-foreground truncate w-40">{item.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border text-muted-foreground">
                                        {formatDate(item.publishedAt || item.createdAt)}
                                    </td>
                                    <td className="px-5 py-3 text-center border-r border-border">
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] uppercase font-bold tracking-wider border ${item.status === 'published' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                                            {item.status || 'draft'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onAction('view', item)}
                                                className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground rounded-md transition-all duration-200"
                                                title="View Blog"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => onAction('edit', item)}
                                                className="p-1.5 hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground rounded-md transition-all duration-200"
                                                title="Edit Blog"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => onAction('delete', item)}
                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-all duration-200"
                                                title="Delete Blog"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogTable;
