import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ArrowLeft, Send, Clock, CheckCircle, AlertOctagon, User, Shield, Lock, CreditCard, Mail, Phone, Calendar, Edit3, Trash2, X, Check } from 'lucide-react';
import { getTicketById, replyToTicket, updateTicketStatus, editTicketMessage, deleteTicketMessage } from '../../api/tickets.api';
import useToast from '../../hooks/useToast';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { socket } from '../../api/socket';

const TicketDetails = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const toast = useToast();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [replying, setReplying] = useState(false);

    // Edit State
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (!id) return;

        loadTicket();

        // WebSocket Integration
        const room = `ticket_${id}`;

        socket.emit('subscribe', room);

        const onNewMessage = (data) => {
            if (data.ticketId === id || data.ticketId === ticket?._id) {
                setTicket(prev => {
                    if (!prev) return prev;
                    // Check if message already exists to avoid duplicates (from local update)
                    if (prev.messages.find(m => m._id === data.message._id)) return prev;
                    return {
                        ...prev,
                        messages: [...prev.messages, data.message]
                    };
                });

                // Auto scroll
                setTimeout(() => {
                    const el = document.querySelector('.chat-scroll-area');
                    if (el) el.scrollTop = el.scrollHeight;
                }, 100);
            }
        };

        socket.on('new_ticket_message', onNewMessage);

        return () => {
            socket.emit('unsubscribe', room);
            socket.off('new_ticket_message', onNewMessage);
        };
    }, [id]);

    const loadTicket = async () => {
        try {
            const { data } = await getTicketById(id);
            setTicket(data);
            // Initial scroll
            setTimeout(() => {
                const el = document.querySelector('.chat-scroll-area');
                if (el) el.scrollTop = el.scrollHeight;
            }, 300);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async () => {
        if (!reply.trim()) return;
        setReplying(true);
        try {
            const { data } = await replyToTicket(id, reply);
            setReply('');
            // Locally update to feel instant (socket will also send it, but we handle dedup)
            setTicket(data);
            // toast.success("Reply sent");

            // Scroll to bottom
            setTimeout(() => {
                const el = document.querySelector('.chat-scroll-area');
                if (el) el.scrollTop = el.scrollHeight;
            }, 100);
        } catch (error) {
            console.error(error);
            toast.error("Failed to send reply");
        } finally {
            setReplying(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateTicketStatus(id, newStatus);
            toast.success(`Ticket marked as ${newStatus}`);
            loadTicket();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    // Edit/Delete Handlers
    const startEditing = (msg) => {
        setEditingMessageId(msg._id);
        setEditContent(msg.message);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const saveEdit = async (messageId) => {
        if (!editContent.trim()) return;
        try {
            await editTicketMessage(id, messageId, editContent);
            toast.success("Message updated");
            setEditingMessageId(null);
            loadTicket();
        } catch (error) {
            toast.error("Failed to update message");
        }
    };

    const deleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteTicketMessage(id, messageId);
            toast.success("Message deleted");
            loadTicket();
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Loading Ticket Data...</div>;
    if (!ticket) return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>;

    const user = ticket.user || {};
    const subject = ticket.subject || '-';
    const ticketType = ticket.ticketType || ticket.category || '-';
    const contactEmail = ticket.contactEmail || user.email || '';
    const contactNumber = ticket.contactNumber || user.phone || '';
    const contactName = user.name || contactEmail || contactNumber || 'Unknown User';

    return (
        <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
            {/* Top Navigation & Actions */}
            <div className="shrink-0 flex items-center justify-between bg-card border border-white/5 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/tickets/all')} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-foreground font-mono">{ticket.ticketId}</h1>
                            <span className={clsx("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                ticket.status === 'Open' || ticket.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                    ticket.status === 'Resolved' || ticket.status === 'RESOLVED' || ticket.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                        'bg-secondary text-muted-foreground border border-white/5'
                            )}>
                                {ticket.status}
                            </span>
                            <span className={clsx("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                                ticket.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    ticket.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            )}>
                                {ticket.priority} Priority
                            </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1 font-medium">{subject}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {(ticket.status !== 'Resolved' && ticket.status !== 'Closed' && ticket.status !== 'RESOLVED') && (
                        <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50"
                            onClick={() => handleStatusUpdate('RESOLVED')}
                        >
                            <CheckCircle size={14} className="mr-2" /> Mark Resolved
                        </Button>
                    )}
                    {(ticket.status === 'Resolved' || ticket.status === 'Closed' || ticket.status === 'RESOLVED') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate('OPEN')}
                        >
                            <AlertOctagon size={14} className="mr-2" /> Re-open Ticket
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
                {/* Left: Chat Conversation */}
                <div className="flex-1 bg-card border border-white/5 rounded-xl flex flex-col overflow-hidden shadow-lg relative min-h-[500px] lg:min-h-0">
                    {/* Chat Header Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar chat-scroll-area">
                        {ticket.messages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 opacity-50">
                                <p>No messages yet.</p>
                            </div>
                        ) : (
                            ticket.messages.map((msg, idx) => (
                                <div key={idx} className={clsx("flex gap-4 max-w-3xl group", msg.sender === 'ADMIN' ? 'ml-auto flex-row-reverse' : '')}>
                                    {/* Avatar */}
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-inner",
                                        msg.sender === 'ADMIN' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-secondary/50 text-muted-foreground border-white/5'
                                    )}>
                                        {msg.sender === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={clsx(
                                        "rounded-2xl p-4 text-sm leading-relaxed shadow-sm min-w-[200px] relative transition-all",
                                        msg.sender === 'ADMIN'
                                            ? 'bg-primary/10 text-foreground border border-primary/20 rounded-tr-none'
                                            : 'bg-secondary/40 text-foreground border border-white/5 rounded-tl-none'
                                    )}>
                                        <div className="flex justify-between items-center mb-2 gap-8 opacity-60 text-[10px] uppercase font-bold tracking-wider">
                                            <span>{msg.sender === 'ADMIN' ? 'Support Team' : contactName}</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(msg.timestamp || Date.now()), 'HH:mm')}</span>
                                        </div>

                                        {editingMessageId === msg._id ? (
                                            <div className="mt-2 space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-background/50 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-primary"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={cancelEditing} className="p-1 hover:bg-white/10 rounded text-red-400"><X size={14} /></button>
                                                    <button onClick={() => saveEdit(msg._id)} className="p-1 hover:bg-white/10 rounded text-emerald-400"><Check size={14} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                        )}

                                        {/* Actions (Strict: Admin can only edit ADMIN messages) */}
                                        {(!editingMessageId && msg.sender === 'ADMIN') && (
                                            <div className={clsx(
                                                "absolute -bottom-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                                                msg.sender === 'ADMIN' ? 'right-0' : 'left-0'
                                            )}>
                                                <button onClick={() => startEditing(msg)} className="text-muted-foreground hover:text-amber-400 transition-colors p-1" title="Edit">
                                                    <Edit3 size={12} />
                                                </button>
                                                <button onClick={() => deleteMessage(msg._id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Delete">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Reply Input Area */}
                    <div className="p-4 border-t border-white/5 bg-secondary/10 backdrop-blur-sm">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 relative">
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={ticket.status === 'Resolved' || ticket.status === 'RESOLVED' ? "This ticket is resolved. Re-open to reply." : "Type your reply as Admin..."}
                                    disabled={ticket.status === 'Resolved' || ticket.status === 'RESOLVED'}
                                    rows={1}
                                    className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:bg-background/80 focus:outline-none resize-none min-h-[50px] max-h-[150px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleReply();
                                        }
                                    }}
                                />
                                <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/30 font-mono">Press Enter to send</div>
                            </div>
                            <Button
                                className="h-[50px] w-[50px] rounded-xl shrink-0 shadow-lg shadow-primary/10"
                                variant="primary"
                                onClick={handleReply}
                                disabled={replying || !reply.trim() || ticket.status === 'Resolved' || ticket.status === 'RESOLVED'}
                            >
                                <Send size={20} className={replying ? "animate-pulse" : ""} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: User Info Panel (Admin View) */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
                    {/* User Profile Card */}
                    <div className="bg-card border border-white/5 rounded-xl p-5 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <User size={14} /> Customer Profile
                        </h3>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-lg font-bold text-foreground">
                                {contactName ? contactName.substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-foreground truncate">{contactName}</h4>
                                <p className="text-xs text-muted-foreground truncate">{contactEmail || 'No Email'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs p-2 bg-secondary/20 rounded-lg border border-white/5">
                                <Phone size={14} className="text-muted-foreground shrink-0" />
                                <span className="text-foreground/80 truncate">{contactNumber || 'No Phone'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs p-2 bg-secondary/20 rounded-lg border border-white/5">
                                <CreditCard size={14} className="text-muted-foreground shrink-0" />
                                <span className="text-foreground/80">Client ID: <span className="font-mono text-primary">{user.clientId || 'N/A'}</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-xs p-2 bg-secondary/20 rounded-lg border border-white/5">
                                <Calendar size={14} className="text-muted-foreground shrink-0" />
                                <span className="text-foreground/80">Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5">
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.open(`mailto:${contactEmail}`)} disabled={!contactEmail}>
                                <Mail size={12} className="mr-2" /> Send Email
                            </Button>
                        </div>
                    </div>

                    {/* Ticket Meta Card */}
                    <div className="bg-card border border-white/5 rounded-xl p-5 shadow-sm flex-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <AlertOctagon size={14} /> Ticket Info
                        </h3>
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Type</span>
                                <span className="bg-secondary px-2 py-1 rounded font-medium">{ticketType}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                                <span className="text-muted-foreground">Description</span>
                                <span className="text-foreground/80 text-right max-w-[65%] truncate">{ticket.description || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">IP Address</span>
                                <span className="font-mono text-foreground/80">{ticket.ipAddress || '127.0.0.1'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span className="text-foreground/80">{ticket.updatedAt ? format(new Date(ticket.updatedAt), 'MMM dd, HH:mm') : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetails;
