import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Settings as SettingsIcon, Shield, Headphones, CreditCard, Bell, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

import { getAllSettings, updateBulkSettings } from '../../api/settings.api';
import useToast from '../../hooks/useToast';


const Settings = () => {
    const [activeTab, setActiveTab] = useState('support'); // support, payment, notifications
    const [settings, setSettings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Available Themes
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await getAllSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async (keysToSave) => {
        setIsLoading(true);
        try {
            const updates = {};
            keysToSave.forEach(key => {
                updates[key] = settings[key];
            });
            await updateBulkSettings(updates);
            toast.success("Settings updated successfully");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">

                    <button
                        onClick={() => setActiveTab('support')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap",
                            activeTab === 'support' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Headphones size={14} /> Support
                    </button>

                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap",
                            activeTab === 'notifications' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Bell size={14} /> Notifications
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6 pb-10">


                    {activeTab === 'support' && (
                        <Card className="terminal-panel bg-card border-border" noPadding>
                            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                                <Headphones size={16} className="text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Support Configuration</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Helpdesk Email</label>
                                        <input
                                            type="email"
                                            value={settings.helpdesk_email || ''}
                                            onChange={(e) => handleSettingChange('helpdesk_email', e.target.value)}
                                            placeholder="help@mspktradesolutions.com"
                                            className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Contact Number</label>
                                        <input
                                            type="text"
                                            value={settings.contact_number || ''}
                                            onChange={(e) => handleSettingChange('contact_number', e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Operating Hours</label>
                                    <input
                                        type="text"
                                        value={settings.operating_hours || ''}
                                        onChange={(e) => handleSettingChange('operating_hours', e.target.value)}
                                        placeholder="Mon - Fri, 9:00 AM - 6:00 PM IST"
                                        className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                                    <Button
                                        variant="primary"
                                        className="gap-2 shadow-lg shadow-primary/20"
                                        onClick={() => saveSettings(['helpdesk_email', 'contact_number', 'operating_hours'])}
                                        isLoading={isLoading}
                                    >
                                        <Save size={16} /> Update Support Settings
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'payment' && (
                        <Card className="terminal-panel bg-card border-border" noPadding>
                            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                                <CreditCard size={16} className="text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Payment Gateway</h3>
                            </div>
                            <div className="p-6 space-y-8">
                                {/* Razorpay Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold text-xs border border-blue-600/30">RZP</div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Razorpay</h4>
                                                <p className="text-[10px] text-muted-foreground">Indian Payment Gateway</p>
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] uppercase font-bold tracking-wider">Active</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Key ID</label>
                                            <input
                                                type="text"
                                                value={settings.razorpay_key_id || ''}
                                                onChange={(e) => handleSettingChange('razorpay_key_id', e.target.value)}
                                                placeholder="rzp_live_xxxxxxxxxxxx"
                                                className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Key Secret</label>
                                            <input
                                                type="password"
                                                value={settings.razorpay_key_secret || ''}
                                                onChange={(e) => handleSettingChange('razorpay_key_secret', e.target.value)}
                                                placeholder="****************"
                                                className="w-full bg-secondary/20 border border-border rounded-lg px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <Button
                                        variant="primary"
                                        className="gap-2 shadow-lg shadow-primary/20"
                                        onClick={() => saveSettings(['razorpay_key_id', 'razorpay_key_secret'])}
                                        isLoading={isLoading}
                                    >
                                        <Save size={16} /> Save Credentials
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card className="terminal-panel bg-card border-border" noPadding>
                            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                                <Bell size={16} className="text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Notification Preferences</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-foreground uppercase">Email Alerts</h4>
                                            <p className="text-[10px] text-muted-foreground">Send transactional emails for purchases and login.</p>
                                        </div>
                                        <div
                                            onClick={() => handleSettingChange('enable_email_alerts', !settings.enable_email_alerts)}
                                            className={`w-10 h-5 rounded-full relative cursor-pointer border transition-colors ${settings.enable_email_alerts ? 'bg-primary/20 border-primary/50' : 'bg-secondary border-border'}`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full shadow-sm transition-all ${settings.enable_email_alerts ? 'right-0.5 bg-primary' : 'left-0.5 bg-muted-foreground'}`}></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-foreground uppercase">WhatsApp Notifications</h4>
                                            <p className="text-[10px] text-muted-foreground">Send trade signals and alerts via WhatsApp API.</p>
                                        </div>
                                        <div
                                            onClick={() => handleSettingChange('enable_whatsapp_alerts', !settings.enable_whatsapp_alerts)}
                                            className={`w-10 h-5 rounded-full relative cursor-pointer border transition-colors ${settings.enable_whatsapp_alerts ? 'bg-primary/20 border-primary/50' : 'bg-secondary border-border'}`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full shadow-sm transition-all ${settings.enable_whatsapp_alerts ? 'right-0.5 bg-primary' : 'left-0.5 bg-muted-foreground'}`}></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-foreground uppercase">Telegram Integration</h4>
                                            <p className="text-[10px] text-muted-foreground">Broadcast messages to Telegram Channel.</p>
                                        </div>
                                        <div
                                            onClick={() => handleSettingChange('enable_telegram_alerts', !settings.enable_telegram_alerts)}
                                            className={`w-10 h-5 rounded-full relative cursor-pointer border transition-colors ${settings.enable_telegram_alerts ? 'bg-primary/20 border-primary/50' : 'bg-secondary border-border'}`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full shadow-sm transition-all ${settings.enable_telegram_alerts ? 'right-0.5 bg-primary' : 'left-0.5 bg-muted-foreground'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <Button
                                        variant="primary"
                                        className="gap-2 shadow-lg shadow-primary/20"
                                        onClick={() => saveSettings(['enable_email_alerts', 'enable_whatsapp_alerts', 'enable_telegram_alerts'])}
                                        isLoading={isLoading}
                                    >
                                        <Save size={16} /> Update Preferences
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;
