import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import { Loader2 } from 'lucide-react';

const PlanValiditySettings = ({ isEmbedded = false }) => {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        preExpiryDays: 3
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { getSetting } = await import('../../api/settings.api');
                const { data } = await getSetting('planValidity');
                if (data && data.value) {
                    // Migration or mapping if needed, otherwise direct set
                    const val = data.value;
                    setSettings({
                        preExpiryDays: val.preExpiryDays || val.reminderDays || 3
                    });
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
            await updateSetting('planValidity', {
                value: settings,
                description: 'Global plan validity configuration'
            });
            toast.success('Validity settings updated successfully');
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
                    <h1 className="text-2xl font-bold text-foreground">Validity Global Settings</h1>
                    <p className="text-muted-foreground text-sm">Configure expiration alerts</p>
                </div>
            )}

            <Card className="terminal-panel bg-card border-border" noPadding={isEmbedded}>
                <div className="space-y-6 p-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pre-Expiry Reminder (Days)</label>
                        <p className="text-xs text-muted-foreground mb-2">When to start sending renewal notifications</p>
                        <input
                            name="preExpiryDays"
                            type="number"
                            value={settings.preExpiryDays}
                            onChange={handleChange}
                            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <h4 className="text-sm font-bold text-orange-500 mb-1">Auto-Renewal Policy</h4>
                        <p className="text-xs text-muted-foreground">
                            Currently, auto-renewal is disabled. Users must manually renew their plans. Enabling this requires a payment gateway that supports recurring billing.
                        </p>
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

export default PlanValiditySettings;
