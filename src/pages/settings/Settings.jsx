import React, { useCallback, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Bell, CreditCard, ExternalLink, KeyRound, Mail, MessageCircle, Save, Send, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

import { getAllSettings, updateBulkSettings } from '../../api/settings.api';
import { getLoginUrl } from '../../api/market.api';
import useToast from '../../hooks/useToast';


const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('notifications');
    const [settings, setSettings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLaunchingKite, setIsLaunchingKite] = useState(false);
    const toast = useToast();

    // Available Themes
    const loadSettings = useCallback(async () => {
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
    }, [toast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

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

    const handleOpenKiteLogin = async () => {
        try {
            setIsLaunchingKite(true);
            const { url } = await getLoginUrl('kite');
            if (!url) {
                toast.error('Failed to generate Zerodha login URL');
                return;
            }

            window.open(url, '_blank', 'noopener,noreferrer');
            toast.success('Zerodha login opened in a new tab');
        } catch (error) {
            console.error('Failed to open Zerodha login', error);
            toast.error(error?.response?.data?.message || 'Failed to open Zerodha login');
        } finally {
            setIsLaunchingKite(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">

                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap",
                            activeTab === 'notifications' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Bell size={14} /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('configuration')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap",
                            activeTab === 'configuration' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <KeyRound size={14} /> Configuration
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6 pb-10">


                    {activeTab === 'configuration' && (
                        <Card className="terminal-panel bg-card border-border" noPadding>
                            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                                <KeyRound size={16} className="text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Zerodha Kite Configuration</h3>
                            </div>
                            <div className="p-4 sm:p-6 space-y-6">
                                <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
                                    <div className="max-w-3xl space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Kite access</div>
                                        <h4 className="text-base sm:text-lg font-semibold text-foreground">Save Zerodha login credentials and launch Kite login quickly</h4>
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            Your saved configuration stays inside admin settings. The login button opens Zerodha in a new tab using the current Kite API configuration.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-6 text-amber-100">
                                    Zerodha login opens in a new tab. This configuration tab is kept intentionally simple with a single login action.
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        variant="primary"
                                        className="h-10 rounded-xl px-4 text-xs gap-2 w-full sm:w-auto"
                                        onClick={handleOpenKiteLogin}
                                        disabled={isLaunchingKite}
                                    >
                                        <ExternalLink size={14} />
                                        {isLaunchingKite ? 'Opening...' : 'Open Zerodha Login'}
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
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Notification Control Center</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="rounded-2xl border border-border bg-card/40 p-5">
                                    <div className="max-w-3xl space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Current stack</div>
                                        <h4 className="text-lg font-semibold text-foreground">Email, Push, WhatsApp, Telegram, and in-app templates</h4>
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            Admin notification controls follow the current backend delivery flow and are managed from
                                            the dedicated notification center.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        {
                                            key: 'email_config',
                                            title: 'Email Alerts',
                                            description: 'Signal and reminder alerts delivered to user email addresses.',
                                            icon: Mail,
                                        },
                                        {
                                            key: 'push_config',
                                            title: 'Push Notifications',
                                            description: 'Browser and mobile alerts using FCM.',
                                            icon: Smartphone,
                                        },
                                        {
                                            key: 'whatsapp_config',
                                            title: 'WhatsApp Delivery',
                                            description: 'Signal alerts sent over WhatsApp Business.',
                                            icon: MessageCircle,
                                        },
                                        {
                                            key: 'telegram_config',
                                            title: 'Telegram Broadcast',
                                            description: 'Channel level market and signal broadcasts.',
                                            icon: Send,
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        const enabled = settings[item.key]?.enabled;

                                        return (
                                            <div key={item.key} className="rounded-xl border border-border bg-card/50 p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={clsx(
                                                        "grid h-10 w-10 place-items-center rounded-xl border",
                                                        enabled
                                                            ? "border-primary/30 bg-primary/10 text-primary"
                                                            : "border-border/70 bg-background text-muted-foreground"
                                                    )}>
                                                        <Icon size={18} />
                                                    </span>
                                                    <div>
                                                        <h5 className="text-xs font-bold uppercase tracking-wide text-foreground">{item.title}</h5>
                                                        <div className={clsx(
                                                            "mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                                                            enabled ? "text-emerald-400" : "text-muted-foreground"
                                                        )}>
                                                            {enabled ? 'Enabled' : 'Disabled'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{item.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <Button
                                        variant="primary"
                                        className="gap-2 shadow-lg shadow-primary/20"
                                        onClick={() => navigate('/settings/notifications')}
                                    >
                                        <Save size={16} /> Open Notification Center
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
