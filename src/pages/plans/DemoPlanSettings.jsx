import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import { Loader2 } from 'lucide-react';

const DemoPlanSettings = ({ isEmbedded = false }) => {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        demoDuration: 7,
        initialBalance: 100000,
        maxOpenPositions: 5
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { getSetting } = await import('../../api/settings.api');
                const { data } = await getSetting('demoPlan');
                if (data && data.value) {
                    setSettings(data.value);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { updateSetting } = await import('../../api/settings.api');
            await updateSetting('demoPlan', {
                value: settings,
                description: 'Global demo plan configuration'
            });
            toast.success('Demo settings updated successfully');
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className={!isEmbedded ? "max-w-3xl mx-auto space-y-6" : "space-y-6"}>
            {!isEmbedded && (
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Demo Plan Settings</h1>
                    <p className="text-muted-foreground text-sm">Configure default parameters for demo trading accounts</p>
                </div>
            )}

            <Card className="terminal-panel bg-card border-border" noPadding={isEmbedded}>
                <div className="space-y-6 p-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Demo Duration (Days)</label>
                        <p className="text-xs text-muted-foreground mb-2">How long a demo account remains active</p>
                        <input
                            name="demoDuration"
                            type="number"
                            value={settings.demoDuration}
                            onChange={handleChange}
                            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Balance (₹)</label>
                        <p className="text-xs text-muted-foreground mb-2">Starting virtual fund for demo users</p>
                        <input
                            name="initialBalance"
                            type="number"
                            value={settings.initialBalance}
                            onChange={handleChange}
                            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Open Positions</label>
                        <p className="text-xs text-muted-foreground mb-2">Limit on simultaneous open trades</p>
                        <input
                            name="maxOpenPositions"
                            type="number"
                            value={settings.maxOpenPositions}
                            onChange={handleChange}
                            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto"
                        >
                            {isSaving ? (
                                <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</>
                            ) : (
                                'Save Configuration'
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DemoPlanSettings;
