import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, Send, Radio, Megaphone, Calendar, Save, Calculator, LayoutTemplate, CheckCircle2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAnnouncement, updateAnnouncement, fetchAnnouncementById } from '../../api/announcements.api';
import { fetchPlans } from '../../api/plans.api';
import useToast from '../../hooks/useToast';

const SEGMENT_OPTIONS = [
    { label: 'Equity Intra', value: 'EQUITY_INTRA' },
    { label: 'Equity Delivery', value: 'EQUITY_DELIVERY' },
    { label: 'Nifty Options', value: 'NIFTY_OPT' },
    { label: 'BankNifty', value: 'BANKNIFTY_OPT' },
    { label: 'FinNifty', value: 'FINNIFTY_OPT' },
    { label: 'Stock Options', value: 'STOCK_OPT' },
    { label: 'Commodity/MCX', value: 'MCX_FUT' },
    { label: 'Currency', value: 'CURRENCY' },
    { label: 'Crypto', value: 'CRYPTO' },
];

const TEMPLATES = {
    SIGNAL: "🚀 NEW SIGNAL ALERT\n\nSymbol: {{SYMBOL}}\nType: {{BUY/SELL}}\nEntry: {{ENTRY}}\nSL: {{SL}}\nTP1: {{TP1}}\nTP2: {{TP2}}\nTP3: {{TP3}}\n\nNotes: {{NOTES}}",
    ECONOMIC: "🌍 ECONOMIC ALERT: {{EVENT}}\n\nCountry: {{COUNTRY}}\nImpact: {{HIGH/MEDIUM}}\nForecast: {{FORECAST}}\nPrevious: {{PREVIOUS}}\n\nStay prepared! 📈",
    UPDATE: "⚠️ PLATFORM UPDATE\n\nWe have updated the system with: \n1. {{FEATURE_1}}\n2. {{FEATURE_2}}\n\nRefresh your app to see changes.",
    URGENT: "🚨 URGENT NOTICE\n\n{{MESSAGE_BODY}}\n\nPlease take immediate notice.",
    EVENT: "📅 UPCOMING EVENT\n\nEvent: {{EVENT_NAME}}\nDate: {{DATE}}\n\nJoin us live for market insights.",
    NEWS: "🗞️ MARKET NEWS\n\n{{HEADLINE}}\n\n{{SUMMARY}}\n\nSource: MSPK Research",
};

const CreateAnnouncement = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'NEWS',
        targetAudience: {
            role: 'all',
            planValues: [],
            segments: []
        },
        startDate: '',
        endDate: '',
        isActive: true,
        priority: 'NORMAL'
    });

    const [pushNotification, setPushNotification] = useState(true);

    useEffect(() => {
        loadPlans();
        if (isEditMode) {
            loadAnnouncement();
        }
    }, [id]);

    const loadPlans = async () => {
        try {
            const response = await fetchPlans();
            setPlans(response.data.results || response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadAnnouncement = async () => {
        try {
            const response = await fetchAnnouncementById(id);
            const data = response.data;
            setFormData({
                title: data.title,
                message: data.message,
                type: data.type,
                targetAudience: {
                    role: data.targetAudience?.role || 'all',
                    planValues: data.targetAudience?.planValues || [],
                    segments: data.targetAudience?.segments || []
                },
                startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
                endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
                isActive: data.isActive,
                priority: data.priority
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to load announcement details');
            navigate('/announcements/all');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.message) {
            toast.error('Please fill in title and message');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined
            };

            if (isEditMode) {
                await updateAnnouncement(id, payload);
                toast.success('Announcement updated successfully');
            } else {
                await createAnnouncement(payload);
                toast.success('Announcement broadcasted successfully');
            }
            navigate('/announcements/all');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save announcement');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadTemplate = () => {
        const template = TEMPLATES[formData.type];
        if (template) {
            setFormData({ ...formData, message: template });
            toast.success(`${formData.type} template loaded`);
        }
    };

    const togglePlan = (planName) => {
        const current = formData.targetAudience.planValues;
        const updated = current.includes(planName)
            ? current.filter(p => p !== planName)
            : [...current, planName];
        setFormData({ ...formData, targetAudience: { ...formData.targetAudience, planValues: updated } });
    };

    const toggleSegment = (segmentValue) => {
        const current = formData.targetAudience.segments;
        const updated = current.includes(segmentValue)
            ? current.filter(s => s !== segmentValue)
            : [...current, segmentValue];
        setFormData({ ...formData, targetAudience: { ...formData.targetAudience, segments: updated } });
    };

    const audienceOptions = [
        { label: 'All Users', value: 'all' },
        { label: 'App Users', value: 'user' },
        { label: 'Sub Brokers', value: 'sub-broker' }
    ];

    const typeOptions = [
        { label: 'News', value: 'NEWS', color: 'border-green-500 bg-green-500/10 text-green-500' },
        { label: 'Update', value: 'UPDATE', color: 'border-blue-500 bg-blue-500/10 text-blue-500' },
        { label: 'Event', value: 'EVENT', color: 'border-purple-500 bg-purple-500/10 text-purple-500' },
        { label: 'Urgent', value: 'URGENT', color: 'border-red-500 bg-red-500/10 text-red-500' },
        { label: 'Signal', value: 'SIGNAL', color: 'border-amber-500 bg-amber-500/10 text-amber-500' },
        { label: 'Economic', value: 'ECONOMIC', color: 'border-cyan-500 bg-cyan-500/10 text-cyan-500' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Megaphone className="text-primary" size={28} />
                    <div>
                        <span className="block">{isEditMode ? 'Edit Broadcast' : 'New Broadcast'}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Transmission System V2.4</span>
                    </div>
                </h1>
                <Button variant="outline" onClick={() => navigate('/announcements/all')} className="gap-2 h-10 px-4 rounded-xl border-white/5 bg-secondary/20 hover:bg-secondary/40 text-xs shadow-inner">
                    <ArrowLeft size={16} /> Cancel
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-md border-border relative overflow-hidden shadow-2xl rounded-2xl">
                        <div className="space-y-6 relative z-10">
                            <Input
                                label="Broadcast Title"
                                placeholder="e.g. Market Alert: Nifty Update"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-secondary/20 border-white/5 h-12 text-base font-medium placeholder:text-muted-foreground/30"
                            />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Radio size={14} className="text-primary" />
                                        Announcement Type
                                    </label>
                                    <button
                                        onClick={handleLoadTemplate}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full transition-all border border-primary/20"
                                    >
                                        <LayoutTemplate size={12} /> LOAD TEMPLATE
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {typeOptions.map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setFormData({ ...formData, type: t.value })}
                                            className={`py-3 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-2 ${formData.type === t.value
                                                ? t.color + ' ring-2 ring-primary/20 scale-[0.98]'
                                                : 'border-white/5 bg-secondary/10 text-muted-foreground hover:bg-secondary/30'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${formData.type === t.value ? 'bg-current pulse' : 'bg-muted-foreground/30'}`}></span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Message Body</label>
                                <textarea
                                    rows={10}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Type your broadcast message content here..."
                                    className="w-full bg-secondary/10 border border-white/5 rounded-2xl px-5 py-4 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none transition-all font-mono leading-relaxed"
                                ></textarea>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Targeting & Schedule */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-md border-border rounded-2xl shadow-xl">
                        <div className="space-y-6">
                            {/* Audience Base */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Main Audience</label>
                                <div className="flex flex-col gap-2">
                                    {audienceOptions.map(a => (
                                        <button
                                            key={a.value}
                                            onClick={() => setFormData({ ...formData, targetAudience: { ...formData.targetAudience, role: a.value } })}
                                            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all ${formData.targetAudience.role === a.value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-white/5 bg-secondary/10 text-muted-foreground hover:bg-secondary/30'
                                                }`}
                                        >
                                            {a.label}
                                            {formData.targetAudience.role === a.value && <CheckCircle2 size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Plan Targeting */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filter by Plan</label>
                                <div className="flex flex-wrap gap-2">
                                    {plans.map(p => (
                                        <button
                                            key={p._id}
                                            onClick={() => togglePlan(p.name)}
                                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${formData.targetAudience.planValues.includes(p.name)
                                                ? 'border-primary/50 bg-primary/20 text-primary'
                                                : 'border-white/5 bg-secondary/10 text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                    {plans.length === 0 && <span className="text-[10px] text-muted-foreground italic">No plans available</span>}
                                </div>
                            </div>

                            {/* Segment Targeting */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filter by Segment</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SEGMENT_OPTIONS.map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => toggleSegment(s.value)}
                                            className={`px-2 py-2 rounded-lg border text-[9px] font-bold uppercase transition-all text-center leading-tight ${formData.targetAudience.segments.includes(s.value)
                                                ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                                                : 'border-white/5 bg-secondary/10 text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* Reach Summary */}
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                                <div className="flex items-center gap-2 text-primary">
                                    <Send size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Reach Report</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">Primary:</span>
                                        <span className="text-foreground font-bold">{formData.targetAudience.role.toUpperCase()}</span>
                                    </div>
                                    {formData.targetAudience.planValues.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-[10px] text-muted-foreground w-full">Plans:</span>
                                            {formData.targetAudience.planValues.map(p => <span key={p} className="bg-primary/20 text-primary px-1.5 rounded scale-90">{p}</span>)}
                                        </div>
                                    )}
                                    {formData.targetAudience.segments.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-[10px] text-muted-foreground w-full">Segments:</span>
                                            {formData.targetAudience.segments.map(s => <span key={s} className="bg-amber-500/20 text-amber-500 px-1.5 rounded scale-90">{s}</span>)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notification Checkbox */}
                            <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-2xl border border-white/5 cursor-pointer hover:bg-secondary/20 transition-all" onClick={() => setPushNotification(!pushNotification)}>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${pushNotification ? 'bg-primary border-primary' : 'border-white/20'}`}>
                                    {pushNotification && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <span className="text-xs font-bold text-foreground">PUSH NOTIFICATION</span>
                            </div>

                            {/* Dates */}
                            <div className="space-y-4">
                                <Input
                                    type="datetime-local"
                                    label="START TIME"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="bg-secondary/20 border-white/5"
                                />
                                <Input
                                    type="datetime-local"
                                    label="EXPIRY TIME"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="bg-secondary/20 border-white/5"
                                />
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-14 rounded-2xl gap-3 shadow-xl shadow-primary/20 text-sm font-bold uppercase tracking-widest group"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading
                                    ? <span className="flex items-center gap-2"><Calculator className="animate-spin" size={18} /> Processing...</span>
                                    : <><Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> {isEditMode ? 'Update Broadcast' : 'Deploy Broadcast'}</>
                                }
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncement;
