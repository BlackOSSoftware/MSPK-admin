import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ArrowLeft, Send, Paperclip, AlertCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../api/tickets.api';
import useToast from '../../hooks/useToast';

const CreateTicket = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [priority, setPriority] = useState('MEDIUM');
    const [category, setCategory] = useState('TECHNICAL');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            await createTicket({
                subject,
                category,
                priority,
                message: description
            });
            toast.success("Ticket created successfully");
            navigate('/tickets');
        } catch (error) {
            console.error(error);
            toast.error("Failed to create ticket");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Open New Ticket</h1>
                        <p className="text-xs text-muted-foreground font-mono">Submit a support request to the administration team.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form */}
                <Card className="md:col-span-2 terminal-panel bg-card border-border" noPadding>
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                        <MessageSquare size={16} className="text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Ticket Details</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                type="text"
                                placeholder="Brief summary of the issue..."
                                className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                                <div className="flex gap-2">
                                    {['TECHNICAL', 'PAYMENT', 'ACCOUNT'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCategory(c)}
                                            className={`flex-1 py-2 px-2 rounded-md border text-[10px] font-bold uppercase tracking-wide transition-all ${category === c
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-secondary/10 text-muted-foreground hover:bg-secondary/30'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Priority</label>
                                <div className="flex gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 py-2 px-2 rounded-md border text-[10px] font-bold uppercase tracking-wide transition-all ${priority === p
                                                ? p === 'HIGH' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-secondary/10 text-muted-foreground hover:bg-secondary/30'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={8}
                                placeholder="Describe the issue in detail..."
                                className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-3 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none resize-none"
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <Button variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:text-foreground">
                                <Paperclip size={14} /> Attach Files
                            </Button>
                            <Button
                                variant="primary"
                                className="gap-2 shadow-lg shadow-primary/20"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <Send size={16} /> {loading ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-blue-500/5 border-blue-500/20 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wide">Before you submit</h4>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Please check the FAQ section before creating a ticket. Most common issues related to payments and login are resolved there.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-card border-border p-6 flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">24/7</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Support Active</div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Average response time for High Priority tickets is under 2 hours.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateTicket;
