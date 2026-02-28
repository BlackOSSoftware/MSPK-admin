import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, HelpCircle, FileText, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import { createFAQ } from '../../api/cms.api';

const CreateFAQ = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [category, setCategory] = useState('General');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSaving(true);
        try {
            await createFAQ({ question, answer, category });
            toast.success('FAQ created successfully');
            navigate('/cms'); // Go back to list
        } catch (error) {
            console.error('Failed to create FAQ', error);
            toast.error('Failed to create FAQ');
        } finally {
            setIsSaving(false);
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
                        <h1 className="text-2xl font-bold text-foreground">Add New FAQ</h1>
                        <p className="text-xs text-muted-foreground font-mono">Create a frequently asked question for the help center.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form */}
                <Card className="md:col-span-2 terminal-panel bg-card border-border" noPadding>
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                        <HelpCircle size={16} className="text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Question Details</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Question</label>
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g., How do I reset my password?"
                                className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                            <div className="flex gap-2">
                                {['General', 'Account', 'Billing', 'Technical'].map(c => (
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
                            <label className="text-xs font-bold text-muted-foreground uppercase">Answer</label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                rows={6}
                                placeholder="Provide a detailed answer..."
                                className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-3 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none resize-none leading-relaxed"
                            ></textarea>
                            <p className="text-[10px] text-muted-foreground text-right">Markdown supported.</p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-end">
                            <Button
                                variant="primary"
                                className="gap-2 shadow-lg shadow-primary/20"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                Publish FAQ
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-card border-border p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Content Tips</h4>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {[
                                'Keep questions concise and direct.',
                                'Use clear, jargon-free language.',
                                'Link to relevant pages if needed.',
                                'Update outdated answers regularly.'
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                                    <div className="w-1 h-1 bg-primary rounded-full mt-1.5 shrink-0"></div>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateFAQ;
