import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { FileText, Shield, DollarSign, Info, HelpCircle, Save, Plus, Trash2, Edit3, Bold, Italic, List, Link, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import { getPage, updatePage, getFAQs, deleteFAQ } from '../../api/cms.api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

import ReactMarkdown from 'react-markdown';

const RichTextEditor = ({ label, slug, initialContent, onSave, onDirtyChange }) => {
    const [content, setContent] = useState(initialContent || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isPreview, setIsPreview] = useState(false); // Mobile toggle
    const textareaRef = useRef(null);

    useEffect(() => {
        setContent(initialContent || '');
    }, [initialContent]);

    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(content !== (initialContent || ''));
        }
    }, [content, initialContent, onDirtyChange]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(slug, { title: label, content });
        setIsSaving(false);
    };

    const insertFormatting = (type) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = text;
        let newCursorPos = end;

        switch (type) {
            case 'bold':
                newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end);
                newCursorPos = end + 4; // adjust for **...**
                if (!selectedText) newCursorPos = start + 2 + 9;
                break;
            case 'italic':
                newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end);
                newCursorPos = end + 2;
                if (!selectedText) newCursorPos = start + 1 + 11;
                break;
            case 'list':
                const lines = selectedText.split('\n');
                const listText = lines.map(line => `- ${line || 'list item'}`).join('\n');
                newText = text.substring(0, start) + (start > 0 && text[start - 1] !== '\n' ? '\n' : '') + listText + text.substring(end);
                newCursorPos = start + (start > 0 && text[start - 1] !== '\n' ? 1 : 0) + listText.length;
                break;
            case 'link':
                newText = text.substring(0, start) + `[${selectedText || 'link text'}](url)` + text.substring(end);
                newCursorPos = end + 3;
                if (!selectedText) newCursorPos = start + 1 + 9;
                break;
            default:
                return;
        }

        setContent(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div className="terminal-panel bg-card border-border h-[calc(100vh-120px)] flex flex-col relative rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Edit3 size={16} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground hidden md:block">{label}</h3>
                    <div className="h-4 w-[1px] bg-border mx-2 md:hidden"></div>
                    <button
                        className={clsx("md:hidden text-[10px] font-bold uppercase px-2 py-1 rounded", !isPreview ? "bg-primary/20 text-primary" : "text-muted-foreground")}
                        onClick={() => setIsPreview(false)}
                    >
                        Edit
                    </button>
                    <button
                        className={clsx("md:hidden text-[10px] font-bold uppercase px-2 py-1 rounded", isPreview ? "bg-primary/20 text-primary" : "text-muted-foreground")}
                        onClick={() => setIsPreview(true)}
                    >
                        Preview
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-muted/20 rounded text-muted-foreground hover:text-foreground transition-colors" title="Bold"><Bold size={14} /></button>
                    <button onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-muted/20 rounded text-muted-foreground hover:text-foreground transition-colors" title="Italic"><Italic size={14} /></button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                    <button onClick={() => insertFormatting('list')} className="p-1.5 hover:bg-muted/20 rounded text-muted-foreground hover:text-foreground transition-colors" title="List"><List size={14} /></button>
                    <button onClick={() => insertFormatting('link')} className="p-1.5 hover:bg-muted/20 rounded text-muted-foreground hover:text-foreground transition-colors" title="Link"><Link size={14} /></button>
                </div>
            </div>

            {/* Split View Area */}
            <div className="flex-1 flex min-h-0 bg-secondary/5"> {/* Added bg for contrast if needed */}
                {/* Editor Pane */}
                <div className={clsx(
                    "flex-1 h-full bg-transparent border-r border-border min-w-0 transition-all relative",
                    isPreview ? "hidden md:block" : "block"
                )}>
                    <textarea
                        ref={textareaRef}
                        className="w-full h-full bg-transparent border-none p-6 text-xs font-mono text-foreground focus:outline-none resize-none leading-relaxed custom-scrollbar placeholder:text-muted-foreground/30"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="# Start typing your content here...\n\nYou can use Markdown formatting."
                    ></textarea>
                </div>

                {/* Preview Pane */}
                <div className={clsx(
                    "flex-1 h-full min-w-0 overflow-y-auto custom-scrollbar p-8 prose prose-invert prose-sm max-w-none transition-all",
                    !isPreview ? "hidden md:block" : "block"
                )}>
                    {content ? (
                        <ReactMarkdown>{content}</ReactMarkdown>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic opacity-50 select-none">
                            Live Preview
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center shrink-0 mt-auto"> {/* Added mt-auto just in case */}
                <p className="text-[10px] text-muted-foreground hidden md:block">
                    Previewing as Markdown. Supports **bold**, *italic*, - lists.
                </p>
                <Button
                    variant="primary"
                    className="gap-2 shadow-lg shadow-primary/20 ml-auto"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                </Button>
            </div>

            {/* Corner Accents (Manual) */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50 opacity-50"></div>
        </div>
    );
};

const CMS = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('terms');

    // Data States
    const [pageData, setPageData] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Dialog State
    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        type: null, // 'TAB_SWITCH' | 'DELETE_FAQ'
        data: null,
        title: '',
        message: '',
        variant: 'primary',
        confirmText: 'Confirm'
    });

    // Fetch Content
    useEffect(() => {
        fetchContent();
    }, [activeTab]);

    const fetchContent = async () => {
        setIsLoading(true);
        setIsDirty(false); // Reset dirty state on new fetch
        try {
            if (activeTab === 'faqs') {
                const response = await getFAQs();
                setFaqs(response.data);
            } else {
                // Fetch page content
                const response = await getPage(activeTab);
                setPageData(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch CMS content', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (newTab) => {
        if (activeTab === newTab) return;

        if (isDirty) {
            setDialogConfig({
                isOpen: true,
                type: 'TAB_SWITCH',
                data: newTab,
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Switching tabs will discard them. Are you sure you want to continue?',
                variant: 'danger',
                confirmText: 'Discard Changes'
            });
            return;
        }

        setActiveTab(newTab);
    }

    const handleDeleteFAQ = (id) => {
        setDialogConfig({
            isOpen: true,
            type: 'DELETE_FAQ',
            data: id,
            title: 'Delete FAQ',
            message: 'Are you sure you want to delete this FAQ? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete'
        });
    };

    const handleConfirmDialog = async () => {
        const { type, data } = dialogConfig;

        if (type === 'TAB_SWITCH') {
            setActiveTab(data);
            setIsDirty(false);
            setDialogConfig(prev => ({ ...prev, isOpen: false }));
        } else if (type === 'DELETE_FAQ') {
            try {
                await deleteFAQ(data);
                toast.success('FAQ deleted');
                fetchContent();
            } catch (error) {
                console.error('Failed to delete FAQ', error);
                toast.error('Failed to delete FAQ');
            } finally {
                setDialogConfig(prev => ({ ...prev, isOpen: false }));
            }
        }
    };

    const handleSavePage = async (slug, data) => {
        try {
            await updatePage(slug, data);
            setPageData(data); // Update local state so it matches saved data
            setIsDirty(false); // Clear dirty state
            toast.success('Page updated successfully');
        } catch (error) {
            console.error('Failed to save page', error);
            toast.error('Failed to save changes');
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground animate-pulse">
                    <div className="animate-spin text-primary mb-2">
                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">Loading Content...</span>
                </div>
            );
        }

        if (activeTab === 'faqs') {
            return (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/cms/faqs/create')}
                            className="gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus size={14} /> Add New Question
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {faqs.length > 0 ? faqs.map((item, idx) => (
                            <Card key={item._id || idx} className="bg-card border-border hover:border-primary/50 transition-colors group">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-secondary/30 rounded text-muted-foreground">{item.category}</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-foreground">{item.question}</h4>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2">{item.answer}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* <button className="p-1 hover:text-primary"><Edit3 size={12} /></button> */}
                                        <button
                                            className="p-1 hover:text-red-500"
                                            onClick={() => handleDeleteFAQ(item._id)}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <div className="text-center py-10 text-muted-foreground text-xs italic">
                                No FAQs found. Create one!
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Render Page Editor
        const getLabel = () => {
            if (activeTab === 'terms') return 'Terms & Conditions';
            if (activeTab === 'privacy') return 'Privacy Policy';
            if (activeTab === 'refund') return 'Refund Policy';
            if (activeTab === 'about') return 'About Us';
            return '';
        };

        return (
            <RichTextEditor
                key={activeTab} // Force remount on tab change
                slug={activeTab}
                label={getLabel()}
                initialContent={pageData?.content}
                onSave={handleSavePage}
                onDirtyChange={setIsDirty}
            />
        );
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto custom-scrollbar">
                    {['terms', 'privacy', 'refund', 'about', 'faqs'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={clsx(
                                "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap",
                                activeTab === tab ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            {tab === 'terms' && <FileText size={14} />}
                            {tab === 'privacy' && <Shield size={14} />}
                            {tab === 'refund' && <DollarSign size={14} />}
                            {tab === 'about' && <Info size={14} />}
                            {tab === 'faqs' && <HelpCircle size={14} />}
                            {tab === 'terms' ? 'Terms' : tab === 'privacy' ? 'Privacy' : tab === 'refund' ? 'Refund' : tab === 'about' ? 'About Us' : 'FAQs'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
                <div className="max-w-5xl mx-auto h-full">
                    {renderContent()}
                </div>
            </div>

            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmDialog}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                confirmVariant={dialogConfig.variant}
            />
        </div>
    );
};

export default CMS;
