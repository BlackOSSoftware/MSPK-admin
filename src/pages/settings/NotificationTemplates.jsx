import React, { useState, useEffect, useRef } from 'react';
import { Save, MessageSquare, RefreshCw, Smartphone, Send, MessageCircle, Bell } from 'lucide-react';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import { getAllSettings, updateSetting } from '../../api/settings.api';
import { clsx } from 'clsx';

// Default templates matching backend config
const DEFAULT_TEMPLATES = {
    SIGNAL_NEW: {
        title: "🚀 New Signal: {{symbol}}",
        body: "Action: {{type}}\nEntry: {{entryPrice}}\nSL: {{stopLoss}}\nTP1: {{target1}}\nTP2: {{target2}}\nTP3: {{target3}}\n\nNotes: {{notes}}"
    },
    SIGNAL_UPDATE: {
        title: "⚠️ Signal Update: {{symbol}}",
        body: "Update for {{symbol}}: {{updateMessage}}\nCurrent Price: {{currentPrice}}"
    },
    SIGNAL_TARGET: {
        title: "🎯 Target Hit: {{symbol}}",
        body: "Target {{targetLevel}} Hit for {{symbol}}!\nProfit Booked. 💰"
    },
    SIGNAL_STOPLOSS: {
        title: "🛑 Stop Loss Hit: {{symbol}}",
        body: "SL Hit for {{symbol}}. Exit Position."
    },
    ANNOUNCEMENT: {
        title: "{{title}}",
        body: "{{message}}"
    },
    ECONOMIC_ALERT: {
        title: "🌍 High Impact: {{event}}",
        body: "Event: {{event}} ({{country}})\nForecast: {{forecast}}\nPrevious: {{previous}}"
    },
    PLAN_EXPIRY_REMINDER: {
        title: "⏳ Plan Expiry Reminder",
        body: "Your subscription for {{planName}} is expiring in {{daysLeft}} days. Renew now to continue services."
    }
};

const VARIABLES_HELP = {
    SIGNAL_NEW: ['{{symbol}}', '{{type}}', '{{entryPrice}}', '{{stopLoss}}', '{{target1}}', '{{target2}}', '{{target3}}', '{{notes}}'],
    SIGNAL_UPDATE: ['{{symbol}}', '{{updateMessage}}', '{{currentPrice}}'],
    SIGNAL_TARGET: ['{{symbol}}', '{{targetLevel}}'],
    SIGNAL_STOPLOSS: ['{{symbol}}'],
    ANNOUNCEMENT: ['{{title}}', '{{message}}'],
    ECONOMIC_ALERT: ['{{event}}', '{{country}}', '{{forecast}}', '{{previous}}'],
    PLAN_EXPIRY_REMINDER: ['{{planName}}', '{{daysLeft}}']
};

const MOCK_DATA = {
    '{{symbol}}': 'XAUUSD',
    '{{type}}': 'BUY',
    '{{entryPrice}}': '2045.50',
    '{{stopLoss}}': '2035.00',
    '{{target1}}': '2055.00',
    '{{target2}}': '2065.00',
    '{{target3}}': '2075.00',
    '{{notes}}': 'Risk Management is key! 🛡️',
    '{{updateMessage}}': 'Move SL to Entry',
    '{{currentPrice}}': '2050.00',
    '{{targetLevel}}': 'TP1',
    '{{title}}': 'Market Holiday Notice',
    '{{message}}': 'Market will remain closed on Monday due to public holiday.',
    '{{event}}': 'Core CPI (MoM)',
    '{{country}}': 'USD',
    '{{forecast}}': '0.3%',
    '{{previous}}': '0.3%',
    '{{planName}}': 'Pro Trader Plan',
    '{{daysLeft}}': '3'
};

const NotificationTemplates = () => {
    const toast = useToast();
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedType, setSelectedType] = useState('SIGNAL_NEW');
    const [previewMode, setPreviewMode] = useState('push'); // push, whatsapp, telegram
    const textareaRef = useRef(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const settings = await getAllSettings();
            // Backend returns object { key: value }, so access directly
            const savedTemplates = settings['notification_templates'];

            if (savedTemplates) {
                setTemplates(prev => ({ ...prev, ...savedTemplates }));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load notification templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSetting('notification_templates', templates);
            toast.success('Notification templates updated successfully');
        } catch (error) {
            console.error('Failed to save templates:', error);
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setTemplates(prev => ({
            ...prev,
            [selectedType]: {
                ...prev[selectedType],
                [field]: value
            }
        }));
    };

    const insertVariable = (variable) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = templates[selectedType].body;
            const newText = text.substring(0, start) + variable + text.substring(end);
            handleChange('body', newText);

            // Restore focus (timeout needed for React render cycle)
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    const getPreviewContent = () => {
        const template = templates[selectedType];
        let title = template.title;
        let body = template.body;

        Object.keys(MOCK_DATA).forEach(key => {
            const regex = new RegExp(`\\${key.substring(0, key.length - 1)}\\}`, 'g'); // Simple regex for {{key}} escaping issues? 
            // Better: use split/join or literal replace loop
            title = title.split(key).join(MOCK_DATA[key]);
            body = body.split(key).join(MOCK_DATA[key]);
        });

        return { title, body };
    };

    const { title: pTitle, body: pBody } = getPreviewContent();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 bg-card border border-white/5 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="text-primary" size={20} />
                        Notification Studio
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Design detailed notifications for every channel.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" className="text-xs" onClick={() => {
                        setTemplates(prev => ({ ...prev, [selectedType]: DEFAULT_TEMPLATES[selectedType] }));
                        toast.success('Reset current template');
                    }}>
                        <RefreshCw size={14} className="mr-2" /> Reset
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto lg:overflow-visible pb-10 lg:pb-0">
                {/* LEFT COLUMN: Editor */}
                <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-visible lg:overflow-y-auto custom-scrollbar pr-0 lg:pr-2 order-2 lg:order-1">
                    {/* Type Selector */}
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                        {Object.keys(DEFAULT_TEMPLATES).map(key => (
                            <button
                                key={key}
                                onClick={() => setSelectedType(key)}
                                className={clsx(
                                    "px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border break-words",
                                    selectedType === key
                                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_hsl(var(--primary)/0.14)]"
                                        : "bg-secondary/30 border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                {key.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="bg-card border border-border/70 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-sm font-bold text-foreground">Message Content</h3>
                            <div className="flex flex-wrap gap-1.5 bg-secondary/20 p-2 rounded-lg">
                                <span className="text-[10px] text-muted-foreground w-full sm:w-auto font-medium">Variables:</span>
                                {(VARIABLES_HELP[selectedType] || []).map(variable => (
                                    <button
                                        key={variable}
                                        onTouchStart={(e) => { e.preventDefault(); insertVariable(variable); }}
                                        onClick={() => insertVariable(variable)}
                                        className="px-2 py-1 rounded bg-secondary/50 border border-border/70 text-[10px] text-primary font-mono hover:bg-primary/20 hover:border-primary/30 active:scale-95 transition-all"
                                        title="Click to insert"
                                    >
                                        {variable}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-1">Title</label>
                                <input
                                    type="text"
                                    value={templates[selectedType].title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full bg-secondary/30 border border-border/70 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                    placeholder="Enter notification title..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-1">Body</label>
                                <textarea
                                    ref={textareaRef}
                                    value={templates[selectedType].body}
                                    onChange={(e) => handleChange('body', e.target.value)}
                                    rows={6}
                                    className="w-full bg-secondary/30 border border-border/70 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none leading-relaxed"
                                    placeholder="Enter message body..."
                                />
                                <p className="text-[10px] text-muted-foreground pl-1">
                                    Supports: *Bold* (WhatsApp), **Bold** (Telegram). Emojis allowed 🚀
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Device Preview */}
                <div className="lg:col-span-5 flex flex-col bg-black/40 rounded-xl border border-white/5 overflow-hidden order-1 lg:order-2 lg:h-[calc(100vh-140px)] lg:sticky lg:top-4">
                    <div className="p-3 bg-black/20 border-b border-white/5 flex justify-center gap-4">
                        <button
                            onClick={() => setPreviewMode('push')}
                            className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all", previewMode === 'push' ? "bg-white text-black" : "text-muted-foreground hover:text-white")}
                        >
                            <Smartphone size={14} /> Lock Screen
                        </button>
                        <button
                            onClick={() => setPreviewMode('telegram')}
                            className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all", previewMode === 'telegram' ? "bg-[#229ED9] text-white" : "text-muted-foreground hover:text-white")}
                        >
                            <Send size={14} /> Telegram
                        </button>
                        <button
                            onClick={() => setPreviewMode('whatsapp')}
                            className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all", previewMode === 'whatsapp' ? "bg-[#25D366] text-white" : "text-muted-foreground hover:text-white")}
                        >
                            <MessageCircle size={14} /> WhatsApp
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">

                        {/* MOCKUP: Lock Screen */}
                        {previewMode === 'push' && (
                            <div className="w-[300px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl text-white animate-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-center mb-6 opacity-80">
                                    <span className="text-xs font-medium">9:41</span>
                                    <div className="flex gap-1">
                                        <div className="w-4 h-2.5 bg-white rounded-[2px]" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Notification Card */}
                                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center">
                                                    <div className="w-3 h-3 bg-gradient-to-br from-primary to-emerald-600 rounded-sm" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">MSPK TRADE SOLUTIONS</span>
                                            </div>
                                            <span className="text-[10px] opacity-60">now</span>
                                        </div>
                                        <h4 className="text-sm font-bold mb-1">{pTitle}</h4>
                                        <p className="text-xs leading-relaxed opacity-90">{pBody}</p>
                                    </div>

                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/5 opacity-50 scale-95 origin-top">
                                        <div className="h-3 w-1/2 bg-white/20 rounded mb-2"></div>
                                        <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MOCKUP: Telegram */}
                        {previewMode === 'telegram' && (
                            <div className="w-[300px] bg-[#17212b] rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[500px]">
                                <div className="bg-[#232e3c] p-3 flex items-center gap-3 border-b border-black/20">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">MS</div>
                                    <div>
                                        <div className="text-sm font-bold text-white">MSPK TRADE SOLUTIONS Official</div>
                                        <div className="text-[10px] text-blue-400">subscribers</div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-[#0e1621] p-3 overflow-hidden relative">
                                    {/* Background Pattern Mock */}
                                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />

                                    <div className="bg-[#182533] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none p-3 max-w-[90%] mb-4 border border-black/10 shadow-sm ml-0">
                                        <p className="text-sm text-white whitespace-pre-wrap">{pBody.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p> {/* Simple mock render */}
                                        <div className="text-[10px] text-white/40 text-right mt-1">10:42 PM</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MOCKUP: WhatsApp */}
                        {previewMode === 'whatsapp' && (
                            <div className="w-[300px] bg-[#0b141a] rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[500px]">
                                <div className="bg-[#202c33] p-3 flex items-center gap-3 border-b border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                                        <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
                                    </div>
                                    <div className="text-white text-sm font-medium">MSPK TRADE SOLUTIONS Group</div>
                                </div>
                                <div className="flex-1 bg-[url('https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c948e91d20548b.png')] bg-cover p-4">
                                    <div className="bg-[#202c33] rounded-lg rounded-tl-none p-2 max-w-[90%] shadow-sm text-sm text-[#e9edef] relative border border-white/5">
                                        <div className="whitespace-pre-wrap">{pBody}</div>
                                        <div className="text-[9px] text-white/50 text-right mt-1 ml-auto">12:00 PM</div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                    <div className="p-3 bg-black/40 text-center">
                        <p className="text-[10px] text-muted-foreground">Preview generated using mock data. Actual rendering may vary by device.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationTemplates;
