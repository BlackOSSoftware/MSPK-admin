import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Database, Zap, Activity, Shield, Save, RefreshCw, Eye, EyeOff, Terminal, Trash2 } from 'lucide-react';
import { getAllSettings, updateBulkSettings } from '../../api/settings.api';
import { getMarketStats, getLoginUrl } from '../../api/market.api';
import useToast from '../../hooks/useToast';
import { getSocket } from '../../api/socket';
import MonitoringDashboard from '../../components/admin/MonitoringDashboard'; // Monitoring Dashboard

const DataFeedConfig = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);

    // Status State
    // Status State
    const [status, setStatus] = useState({
        provider: 'none',
        mode: 'simulation',
        uptime: '0s',
        kite: { connected: false, latency: 'Disconnected', ticks: 0 },
        alltick: { connected: false, latency: 'Disconnected', ticks: 0 }
    });

    // Logs State
    const [logs, setLogs] = useState([]);

    // State for all loaded settings (to prevent overwriting other providers when switching)
    const [allSettings, setAllSettings] = useState({});

    // Config State
    const [config, setConfig] = useState({
        data_feed_provider: 'kite',
        data_feed_api_key: '',
        data_feed_api_secret: ''
    });

    useEffect(() => {
        loadSettings();

        // Initial Fetch
        fetchStats();

        // Socket Listener (Optimized)
        try {
            const socket = getSocket();
            if (socket) {
                socket.on('market_stats', (stats) => {
                    if (stats) {
                        setStatus(prev => ({
                            ...prev,
                            provider: stats.provider,
                            mode: stats.mode,
                            uptime: formatUptime(stats.uptime),
                            kite: stats.kite || { connected: false, latency: 'Disconnected', ticks: 0 },
                            alltick: stats.alltick || { connected: false, latency: 'Disconnected', ticks: 0 }
                        }));
                    }
                });

                socket.on('system_log', (log) => {
                    setLogs(prev => [log, ...prev].slice(0, 50)); // Keep last 50 logs
                });
            }

            return () => {
                if (socket) {
                    socket.off('market_stats');
                    socket.off('system_log');
                }
            };
        } catch (e) {
            console.error("Socket not available", e);
        }
    }, []);

    const fetchStats = async () => {
        try {
            const stats = await getMarketStats();
            if (stats) {
                setStatus(prev => ({
                    ...prev,
                    provider: stats.provider,
                    mode: stats.mode,
                    uptime: formatUptime(stats.uptime),
                    kite: stats.kite || { connected: false, latency: 'Disconnected', ticks: 0 },
                    alltick: stats.alltick || { connected: false, latency: 'Disconnected', ticks: 0 }
                }));
            }
        } catch (error) {
            console.error("Failed to fetch market stats", error);
        }
    };

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const loadSettings = async () => {
        setLoading(true);
        try {
            const settings = await getAllSettings();
            if (settings) {
                setAllSettings(settings);

                // Set Default View based on current provider or default to kite
                const currentProvider = settings.data_feed_provider || 'kite';

                setConfig({
                    data_feed_provider: currentProvider,
                    data_feed_api_key: settings[`${currentProvider}_api_key`] || '',
                    data_feed_api_secret: settings[`${currentProvider}_api_secret`] || ''
                });
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleProviderChange = (provider) => {
        // Switch view to selected provider and load their keys from memory
        setConfig({
            data_feed_provider: provider,
            data_feed_api_key: allSettings[`${provider}_api_key`] || '',
            data_feed_api_secret: allSettings[`${provider}_api_secret`] || ''
        });
    };

    const handleInputChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));

        // Update local memory map so we don't lose it if user switches tabs before saving
        const provider = config.data_feed_provider;
        const keyMap = {
            'data_feed_api_key': `${provider}_api_key`,
            'data_feed_api_secret': `${provider}_api_secret`
        };

        if (keyMap[field]) {
            setAllSettings(prev => ({
                ...prev,
                [keyMap[field]]: value
            }));
        }
    };

    const handleSave = async () => {
        if (!config.data_feed_api_key) {
            toast.error(`API Key is required for ${config.data_feed_provider.toUpperCase()}`);
            return;
        }

        if (config.data_feed_provider === 'kite' && !config.data_feed_api_secret) {
            toast.error(`API Secret is required for KITE`);
            return;
        }

        setSaving(true);
        try {
            // Save specific keys for the current provider
            const provider = config.data_feed_provider;
            const payload = {
                data_feed_provider: provider, // Set active provider
                [`${provider}_api_key`]: config.data_feed_api_key,
                [`${provider}_api_secret`]: config.data_feed_api_secret
            };

            await updateBulkSettings(payload);
            toast.success(`Configuration for ${provider.toUpperCase()} saved successfully`);

            // Re-fetch to ensure sync
            loadSettings();

        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!config.data_feed_api_key) {
            toast.error("Please enter and SAVE your API Key first");
            return;
        }

        const provider = config.data_feed_provider;
        setTesting(true);
        try {
            // 1. Get Login URL from Backend (Generic)
            const { url } = await getLoginUrl(provider);

            if (url) {
                // 2. Open Login in new tab
                window.open(url, '_blank');
                toast.success(`Redirecting to ${provider.toUpperCase()} for verification...`);
            } else {
                toast.error("Failed to generate login URL");
            }

        } catch (error) {
            console.error("Verification failed", error);
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">

            {/* Status Card */}
            {/* Status Card */}
            {(() => {
                const currentViewStats = status[config.data_feed_provider] || { connected: false, latency: 'Disconnected', ticks: 0 };
                const isActiveProvider = status.provider === config.data_feed_provider;

                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 terminal-panel bg-card border-border relative overflow-hidden" noPadding>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Activity size={100} />
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    {/* Connection Indicator specific to the VIEWED provider */}
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${currentViewStats.connected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'
                                        }`}></div>

                                    <h3 className="text-lg font-bold text-foreground">{config.data_feed_provider === 'kite' ? 'Kite Zerodha' : 'AllTick Global'} Status</h3>

                                    {isActiveProvider && (
                                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 uppercase tracking-wider border border-emerald-500/20">
                                            Active Feed
                                        </span>
                                    )}

                                    {status.mode === 'simulation' && (
                                        <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase tracking-wider border border-amber-500/20">
                                            Simulation Mode
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Latency</div>
                                        <div className={`text-xl font-mono font-bold mt-1 ${currentViewStats.connected ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {currentViewStats.latency}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Tick Count</div>
                                        <div className="text-xl font-mono text-foreground font-bold mt-1">
                                            {Number(currentViewStats.tickCount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="terminal-panel bg-card border-border flex flex-col justify-center items-center gap-3" noPadding>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">Total Updates</div>
                            <div className="text-4xl font-mono text-foreground font-black">
                                {Number(currentViewStats.tickCount || 0).toLocaleString()}
                            </div>
                            <div className="text-[9px] text-muted-foreground uppercase">{config.data_feed_provider} Ticks Only</div>
                        </Card>
                    </div>
                );
            })()}

            {/* Configuration Form */}
            <Card className="terminal-panel bg-card border-border overflow-visible" noPadding>
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database size={16} className="text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">API Configuration</h3>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] border-border gap-1 hover:border-primary/50"
                        onClick={handleTestConnection}
                        disabled={testing || config.data_feed_provider === 'alltick'}
                    >
                        <RefreshCw size={10} className={testing ? "animate-spin" : ""} /> {config.data_feed_provider === 'alltick' ? 'Permanent Token' : (testing ? 'Verifying...' : 'Verify & Login')}
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground animate-pulse">Loading Configuration...</div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Select Provider</label>
                                <div className="flex gap-4">
                                    {['kite', 'alltick'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => handleProviderChange(p)}
                                            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-bold uppercase tracking-wide transition-all ${config.data_feed_provider === p
                                                ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                                                : 'border-border bg-secondary/10 text-muted-foreground hover:bg-secondary/30'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showSecrets ? "text" : "password"}
                                            value={config.data_feed_api_key}
                                            onChange={(e) => handleInputChange('data_feed_api_key', e.target.value)}
                                            placeholder={`Enter ${config.data_feed_provider.toUpperCase()} ${config.data_feed_provider === 'alltick' ? 'Token' : 'API Key'}`}
                                            className="w-full bg-secondary/20 border border-border rounded-lg pl-4 pr-10 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                        <Shield size={14} className="absolute right-3 top-3 text-muted-foreground/30 pointer-events-none" />
                                    </div>
                                </div>
                                {config.data_feed_provider !== 'alltick' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">API Secret</label>
                                        <div className="relative">
                                            <input
                                                type={showSecrets ? "text" : "password"}
                                                value={config.data_feed_api_secret}
                                                onChange={(e) => handleInputChange('data_feed_api_secret', e.target.value)}
                                                placeholder={`Enter ${config.data_feed_provider.toUpperCase()} API Secret`}
                                                className="w-full bg-secondary/20 border border-border rounded-lg pl-4 pr-10 py-2.5 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecrets(!showSecrets)}
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                            >
                                                {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-end">
                                <Button
                                    variant="primary"
                                    className="gap-2 shadow-lg shadow-primary/20 min-w-[160px]"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : <><Save size={16} /> Save Configuration</>}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
            {/* Client-Side Monitoring Dashboard */}
            <div className="mb-6">
                <MonitoringDashboard />
            </div>

            {/* System Logs Terminal */}
            <Card className="terminal-panel bg-card border-border overflow-hidden" noPadding>
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">System Logs Feed</h3>
                    </div>
                    <button
                        onClick={() => setLogs([])}
                        className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                        <Trash2 size={10} /> Clear
                    </button>
                </div>
                <div className="bg-black/80 p-4 font-mono text-[11px] h-64 overflow-y-auto space-y-1.5 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-muted-foreground/30 text-center py-20 italic">No logs received yet...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-muted-foreground whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={`font-bold uppercase whitespace-nowrap ${log.level === 'error' ? 'text-red-500' :
                                    log.level === 'warn' ? 'text-amber-500' : 'text-emerald-500'
                                    }`}>
                                    {log.level}:
                                </span>
                                <span className="text-zinc-300 break-all">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DataFeedConfig;
