import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Tag, Plus, Trash2, Shield, Send, Loader2 } from 'lucide-react'; // Added Loader2
import { getSegments, createSegment, deleteSegment } from '../../api/market.api';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog'; // Import ConfirmDialog

const SignalConfiguration = () => {
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // New Segment State
    const [newCatName, setNewCatName] = useState('');
    const [newCatCode, setNewCatCode] = useState('');

    // Fetch Segments
    useEffect(() => {
        loadSegments();
    }, []);

    const loadSegments = async () => {
        try {
            const data = await getSegments();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load segments", error);
            // toast.error("Failed to load segments"); // Suppress on init to avoid noise if network blip
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim() || !newCatCode.trim()) {
            toast.error("Name and Code are required");
            return;
        }

        setIsAdding(true);
        try {
            await createSegment({
                name: newCatName,
                code: newCatCode.toUpperCase()
            });
            toast.success("Segment added successfully");
            setNewCatName('');
            setNewCatCode('');
            loadSegments(); // Refresh list
        } catch (error) {
            console.error("Failed to add segment", error);
            toast.error(error.response?.data?.message || "Failed to add segment");
        } finally {
            setIsAdding(false);
        }
    };

    const confirmDelete = (id) => {
        setSelectedId(id);
        setConfirmOpen(true);
    };

    const handleDeleteCategory = async () => {
        if (!selectedId) return;

        try {
            await deleteSegment(selectedId);
            toast.success("Segment deleted");
            setCategories(categories.filter(c => c._id !== selectedId));
        } catch (error) {
            console.error("Failed to delete segment", error);
            // Allow backend error message to pass through (e.g. "Cannot delete...")
            toast.error(error.response?.data?.message || "Failed to delete segment");
        } finally {
            setConfirmOpen(false);
            setSelectedId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDeleteCategory}
                title="Delete Segment?"
                message="Are you sure you want to delete this segment? This action cannot be undone."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Categories Management */}
                <Card className="terminal-panel bg-card border-border" noPadding>
                    <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Signal Segments</h3>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{categories.length} SEGMENTS</span>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Add New Input Group */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="Segment Name (e.g. Crypto)"
                                className="flex-[2] bg-secondary/30 border border-border rounded-lg px-3 py-2 text-xs font-mono focus:border-primary/50 focus:outline-none"
                            />
                            <input
                                type="text"
                                value={newCatCode}
                                onChange={(e) => setNewCatCode(e.target.value)}
                                placeholder="Code (e.g. CRYPTO)"
                                className="flex-1 bg-secondary/30 border border-border rounded-lg px-3 py-2 text-xs font-mono focus:border-primary/50 focus:outline-none uppercase"
                            />
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={handleAddCategory}
                                disabled={isAdding}
                                className="w-10 flex items-center justify-center shrink-0"
                            >
                                {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            </Button>
                        </div>

                        {/* List */}
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 size={20} className="animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <div key={cat._id} className="group relative flex items-center bg-secondary/20 border border-border rounded-md pl-3 pr-8 py-1.5 transition-all hover:bg-secondary/40 hover:border-primary/30">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-foreground">{cat.name}</span>
                                            <span className="text-[8px] text-muted-foreground uppercase">{cat.code}</span>
                                        </div>
                                        <button
                                            onClick={() => confirmDelete(cat._id)}
                                            className="absolute right-1 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Automation Channels */}
                <Card className="terminal-panel bg-card border-border" noPadding>
                    <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Send size={16} className="text-blue-500" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Automation Channels</h3>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold font-mono uppercase">System Online</span>
                    </div>

                    <AutomationSettings />
                </Card>
            </div>
        </div>
    );
};

// Sub-component for clean separation
const AutomationSettings = () => {
    const toast = useToast();
    const [settings, setSettings] = useState({
        telegram_config: { enabled: false, botToken: '', channelId: '' },
        whatsapp_config: { enabled: false, apiKey: '', phoneNumberId: '' },
        push_config: { enabled: false, fcmServerKey: '' }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { getSettings } = await import('../../api/setting.api');
            const data = await getSettings();

            // Merge defaults in case backend returns partial data
            setSettings(prev => ({
                telegram_config: { ...prev.telegram_config, ...(data.telegram_config || {}) },
                whatsapp_config: { ...prev.whatsapp_config, ...(data.whatsapp_config || {}) },
                push_config: { ...prev.push_config, ...(data.push_config || {}) },
            }));
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error("Failed to load automation settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { updateSettings } = await import('../../api/setting.api');

            // Prepare payload
            const payload = {
                telegram_config: settings.telegram_config,
                whatsapp_config: settings.whatsapp_config,
                push_config: settings.push_config
            };

            await updateSettings(payload);
            toast.success("Automation settings saved successfully");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (channel, field, value) => {
        setSettings(prev => ({
            ...prev,
            [channel]: { ...prev[channel], [field]: value }
        }));
    };

    if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    return (
        <div className="p-6 space-y-8">
            {/* Telegram */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                            Telegram Broadcast
                            {settings.telegram_config.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Auto-post signals to Telegram Channel</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.telegram_config.enabled}
                            onChange={(e) => handleChange('telegram_config', 'enabled', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {settings.telegram_config.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={settings.telegram_config.botToken}
                            onChange={(e) => handleChange('telegram_config', 'botToken', e.target.value)}
                            placeholder="Bot Token (e.g. 12345:ABC-DEF)"
                            className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full focus:border-primary/50 focus:outline-none"
                        />
                        <input
                            type="text"
                            value={settings.telegram_config.channelId}
                            onChange={(e) => handleChange('telegram_config', 'channelId', e.target.value)}
                            placeholder="Channel ID (e.g. @MySignalChannel)"
                            className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full focus:border-primary/50 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="h-[1px] bg-white/5"></div>

            {/* WhatsApp */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                            WhatsApp API
                            {settings.whatsapp_config.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Send alerts via WhatsApp Business</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.whatsapp_config.enabled}
                            onChange={(e) => handleChange('whatsapp_config', 'enabled', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {settings.whatsapp_config.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="password"
                            value={settings.whatsapp_config.apiKey}
                            onChange={(e) => handleChange('whatsapp_config', 'apiKey', e.target.value)}
                            placeholder="WA Access Token"
                            className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full focus:border-primary/50 focus:outline-none"
                        />
                        <input
                            type="text"
                            value={settings.whatsapp_config.phoneNumberId}
                            onChange={(e) => handleChange('whatsapp_config', 'phoneNumberId', e.target.value)}
                            placeholder="Phone Number ID"
                            className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full focus:border-primary/50 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="h-[1px] bg-white/5"></div>

            {/* Push Notifications */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                            App Push Notifications
                            {settings.push_config.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Firebase Cloud Messaging (FCM)</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.push_config.enabled}
                            onChange={(e) => handleChange('push_config', 'enabled', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {settings.push_config.enabled && (
                    <div className="pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="password"
                            value={settings.push_config.fcmServerKey}
                            onChange={(e) => handleChange('push_config', 'fcmServerKey', e.target.value)}
                            placeholder="FCM Legacy Server Key"
                            className="bg-secondary/30 border border-border rounded px-3 py-2 text-xs font-mono w-full focus:border-primary/50 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="min-w-[120px]"
                >
                    {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                    Save Config
                </Button>
            </div>
        </div>
    );
};

export default SignalConfiguration;
