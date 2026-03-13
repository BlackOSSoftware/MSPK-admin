import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Bot,
  KeyRound,
  Mail,
  MessageCircle,
  RefreshCw,
  Save,
  Send,
  Smartphone,
} from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';
import { getAllSettings, updateBulkSettings, updateSetting } from '../../api/settings.api';

const DEFAULT_CHANNEL_CONFIGS = {
  email_config: { enabled: true },
  push_config: { enabled: false, fcmServerKey: '' },
  whatsapp_config: { enabled: false, apiKey: '', phoneNumberId: '' },
  telegram_config: { enabled: false, botToken: '', channelId: '' },
};

const DEFAULT_TEMPLATES = {
  SIGNAL_NEW: {
    title: 'New Signal: {{symbol}}',
    body: 'Action: {{type}}\nEntry: {{entryPrice}}\nSL: {{stopLoss}}\nTP1: {{target1}}\nTP2: {{target2}}\nTP3: {{target3}}',
  },
  SIGNAL_UPDATE: {
    title: 'Signal Update: {{symbol}}',
    body: 'Update for {{symbol}}: {{updateMessage}}\nCurrent Price: {{currentPrice}}',
  },
  SIGNAL_TARGET: {
    title: 'Target Hit: {{symbol}}',
    body: '{{symbol}} reached {{targetLevel}}.\nExit: {{exitPrice}}\nPoints: {{pointsLabel}}',
  },
  SIGNAL_PARTIAL_PROFIT: {
    title: 'Partial Profit Booked: {{symbol}}',
    body: 'Partial profit booked in {{symbol}}.\nExit: {{exitPrice}}\nPoints: {{pointsLabel}}',
  },
  SIGNAL_STOPLOSS: {
    title: 'Stop Loss Hit: {{symbol}}',
    body: 'Stop loss hit for {{symbol}}.\nExit: {{exitPrice}}\nPoints: {{pointsLabel}}',
  },
  ANNOUNCEMENT: {
    title: '{{title}}',
    body: '{{message}}',
  },
  ECONOMIC_ALERT: {
    title: 'Economic Alert: {{event}}',
    body: 'Country: {{country}}\nForecast: {{forecast}}\nPrevious: {{previous}}',
  },
  PLAN_EXPIRY_REMINDER: {
    title: 'Plan Expiry Reminder',
    body: 'Your {{planName}} expires in {{daysLeft}} day(s). Renew to continue access.',
  },
  TICKET_REPLY: {
    title: 'New Ticket Reply: {{ticketId}}',
    body: 'Admin reply: {{message}}',
  },
};

const VARIABLES_HELP = {
  SIGNAL_NEW: ['{{symbol}}', '{{type}}', '{{entryPrice}}', '{{stopLoss}}', '{{target1}}', '{{target2}}', '{{target3}}'],
  SIGNAL_UPDATE: ['{{symbol}}', '{{updateMessage}}', '{{currentPrice}}'],
  SIGNAL_TARGET: ['{{symbol}}', '{{targetLevel}}', '{{exitPrice}}', '{{pointsLabel}}'],
  SIGNAL_PARTIAL_PROFIT: ['{{symbol}}', '{{exitPrice}}', '{{pointsLabel}}'],
  SIGNAL_STOPLOSS: ['{{symbol}}', '{{exitPrice}}', '{{pointsLabel}}'],
  ANNOUNCEMENT: ['{{title}}', '{{message}}'],
  ECONOMIC_ALERT: ['{{event}}', '{{country}}', '{{forecast}}', '{{previous}}'],
  PLAN_EXPIRY_REMINDER: ['{{planName}}', '{{daysLeft}}'],
  TICKET_REPLY: ['{{ticketId}}', '{{message}}'],
};

const MOCK_DATA = {
  '{{symbol}}': 'BTCUSD',
  '{{type}}': 'BUY',
  '{{entryPrice}}': '68427.00',
  '{{stopLoss}}': '68405.34',
  '{{target1}}': '68565.46',
  '{{target2}}': '68703.92',
  '{{target3}}': '68842.38',
  '{{updateMessage}}': 'Move stop loss to entry.',
  '{{currentPrice}}': '68512.55',
  '{{targetLevel}}': 'TP1',
  '{{exitPrice}}': '68110.25',
  '{{totalPoints}}': '88.75',
  '{{pointsLabel}}': '+88.75',
  '{{title}}': 'Weekend Maintenance',
  '{{message}}': 'Services will be read-only on Sunday from 02:00 to 03:30 IST.',
  '{{event}}': 'US Core CPI',
  '{{country}}': 'USD',
  '{{forecast}}': '0.3%',
  '{{previous}}': '0.4%',
  '{{planName}}': 'Pro Signals',
  '{{daysLeft}}': '2',
  '{{ticketId}}': 'TKT-2041',
};

const CHANNEL_META = {
  email_config: {
    label: 'Email',
    title: 'Email Delivery',
    description: 'Signal and reminder alerts sent through SMTP or MSG91 email.',
    icon: Mail,
    fields: [],
  },
  push_config: {
    label: 'Push',
    title: 'App Push Notifications',
    description: 'FCM based alerts for browser and mobile users.',
    icon: Smartphone,
    fields: [
      { key: 'fcmServerKey', label: 'FCM server key', placeholder: 'Paste the current FCM server key', type: 'password' },
    ],
  },
  whatsapp_config: {
    label: 'WhatsApp',
    title: 'WhatsApp Delivery',
    description: 'Signal alerts sent through the WhatsApp Business API.',
    icon: MessageCircle,
    fields: [
      { key: 'apiKey', label: 'Access token', placeholder: 'Paste the WhatsApp access token', type: 'password' },
      { key: 'phoneNumberId', label: 'Phone number ID', placeholder: 'Meta phone number ID', type: 'text' },
    ],
  },
  telegram_config: {
    label: 'Telegram',
    title: 'Telegram Broadcast',
    description: 'Broadcast messages to the configured Telegram channel.',
    icon: Send,
    fields: [
      { key: 'botToken', label: 'Bot token', placeholder: 'Telegram bot token', type: 'password' },
      { key: 'channelId', label: 'Channel ID', placeholder: '@channel or numeric channel id', type: 'text' },
    ],
  },
};

const replaceTemplateVariables = (value) => {
  let output = value || '';
  Object.entries(MOCK_DATA).forEach(([key, replacement]) => {
    output = output.split(key).join(replacement);
  });
  return output;
};

const NotificationTemplates = () => {
  const toast = useToast();
  const textareaRef = useRef(null);

  const [channelConfigs, setChannelConfigs] = useState(DEFAULT_CHANNEL_CONFIGS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedType, setSelectedType] = useState('SIGNAL_NEW');
  const [previewMode, setPreviewMode] = useState('push');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingChannels, setIsSavingChannels] = useState(false);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getAllSettings();
        const savedTemplates = settings?.notification_templates || {};

        setTemplates((prev) => ({ ...prev, ...savedTemplates }));
        setChannelConfigs({
          email_config: { ...DEFAULT_CHANNEL_CONFIGS.email_config, ...(settings?.email_config || {}) },
          push_config: { ...DEFAULT_CHANNEL_CONFIGS.push_config, ...(settings?.push_config || {}) },
          whatsapp_config: { ...DEFAULT_CHANNEL_CONFIGS.whatsapp_config, ...(settings?.whatsapp_config || {}) },
          telegram_config: { ...DEFAULT_CHANNEL_CONFIGS.telegram_config, ...(settings?.telegram_config || {}) },
        });
      } catch (error) {
        console.error('Failed to load notification settings', error);
        toast.error('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleChannelChange = (channel, field, value) => {
    setChannelConfigs((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value,
      },
    }));
  };

  const handleTemplateChange = (field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        [field]: value,
      },
    }));
  };

  const handleInsertVariable = (variable) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      handleTemplateChange('body', `${templates[selectedType].body}${variable}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = templates[selectedType].body || '';
    const nextBody = `${currentBody.slice(0, start)}${variable}${currentBody.slice(end)}`;

    handleTemplateChange('body', nextBody);

    setTimeout(() => {
      textarea.focus();
      const nextPosition = start + variable.length;
      textarea.setSelectionRange(nextPosition, nextPosition);
    }, 0);
  };

  const handleSaveChannels = async () => {
    setIsSavingChannels(true);
    try {
      await updateBulkSettings(channelConfigs);
      toast.success('Notification channels updated');
    } catch (error) {
      console.error('Failed to save channel configs', error);
      toast.error('Failed to save channel settings');
    } finally {
      setIsSavingChannels(false);
    }
  };

  const handleSaveTemplates = async () => {
    setIsSavingTemplates(true);
    try {
      await updateSetting('notification_templates', templates);
      toast.success('Notification templates updated');
    } catch (error) {
      console.error('Failed to save templates', error);
      toast.error('Failed to save templates');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const previewTitle = replaceTemplateVariables(templates[selectedType]?.title || '');
  const previewBody = replaceTemplateVariables(templates[selectedType]?.body || '');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 overflow-hidden">
      <div className="shrink-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Bell size={12} />
              Notification Center
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live channel controls and template studio</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              This page matches the current backend delivery stack: Email, Push, WhatsApp, Telegram, and in-app
              notification templates.
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-3 gap-3">
            {Object.entries(CHANNEL_META).map(([key, meta]) => {
              const enabled = channelConfigs[key]?.enabled;
              const Icon = meta.icon;

              return (
                <div key={key} className="rounded-2xl border border-border/70 bg-muted/[0.06] p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'grid h-9 w-9 place-items-center rounded-xl border',
                        enabled
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/70 bg-card text-muted-foreground'
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wide text-foreground">{meta.label}</div>
                      <div
                        className={clsx(
                          'text-[10px] font-semibold uppercase tracking-[0.18em]',
                          enabled ? 'text-emerald-400' : 'text-muted-foreground'
                        )}
                      >
                        {enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="custom-scrollbar order-2 min-h-0 overflow-y-auto xl:order-1 xl:col-span-5">
          <div className="space-y-4 pr-0 xl:pr-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Delivery Channels</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Configure only the channels that are actually used by the backend.</p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveChannels}
                  disabled={isSavingChannels}
                  className="gap-2"
                >
                  {isSavingChannels ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Channels
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {Object.entries(CHANNEL_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  const config = channelConfigs[key] || {};

                  return (
                    <div key={key} className="rounded-2xl border border-border/70 bg-muted/[0.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={clsx(
                              'grid h-10 w-10 place-items-center rounded-xl border',
                              config.enabled
                                ? 'border-primary/30 bg-primary/10 text-primary'
                                : 'border-border/70 bg-card text-muted-foreground'
                            )}
                          >
                            <Icon size={18} />
                          </span>

                          <div>
                            <h3 className="text-sm font-bold text-foreground">{meta.title}</h3>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.description}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleChannelChange(key, 'enabled', !config.enabled)}
                          className={clsx(
                            'relative h-6 w-11 rounded-full border transition-colors',
                            config.enabled
                              ? 'border-primary/40 bg-primary/20'
                              : 'border-border bg-secondary'
                          )}
                        >
                          <span
                            className={clsx(
                              'absolute top-0.5 h-4 w-4 rounded-full transition-all',
                              config.enabled
                                ? 'right-0.5 bg-primary'
                                : 'left-0.5 bg-muted-foreground'
                            )}
                          />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3">
                        {meta.fields.map((field) => (
                          <label key={`${key}-${field.key}`} className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{field.label}</span>
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
                              {field.key.toLowerCase().includes('token') || field.key.toLowerCase().includes('key') ? (
                                <KeyRound size={14} className="text-muted-foreground" />
                              ) : (
                                <Bot size={14} className="text-muted-foreground" />
                              )}
                              <input
                                type={field.type}
                                value={config[field.key] || ''}
                                onChange={(event) => handleChannelChange(key, field.key, event.target.value)}
                                placeholder={field.placeholder}
                                className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar order-1 min-h-0 overflow-y-auto xl:order-2 xl:col-span-7">
          <div className="space-y-4 pr-0 xl:pr-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Template Studio</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Edit the exact templates used by signal, announcement, reminder, and support notifications.</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTemplates((prev) => ({
                      ...prev,
                      [selectedType]: DEFAULT_TEMPLATES[selectedType],
                    }))}
                    className="gap-2"
                  >
                    <RefreshCw size={14} />
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveTemplates}
                    disabled={isSavingTemplates}
                    className="gap-2"
                  >
                    {isSavingTemplates ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Templates
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                  {Object.keys(DEFAULT_TEMPLATES).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedType(key)}
                      className={clsx(
                        'w-full rounded-xl border px-3 py-3 text-left transition-all',
                        selectedType === key
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.16)]'
                          : 'border-border/70 bg-muted/[0.04] text-muted-foreground hover:bg-muted/[0.08] hover:text-foreground'
                      )}
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.18em]">{key.replace(/_/g, ' ')}</div>
                      <div className="mt-1 text-[11px] leading-5">{DEFAULT_TEMPLATES[key].title}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4">
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Title</span>
                      <input
                        type="text"
                        value={templates[selectedType]?.title || ''}
                        onChange={(event) => handleTemplateChange('title', event.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-muted/[0.04] px-4 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                        placeholder="Notification title"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Body</span>
                      <textarea
                        ref={textareaRef}
                        value={templates[selectedType]?.body || ''}
                        onChange={(event) => handleTemplateChange('body', event.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-border bg-muted/[0.04] px-4 py-3 text-sm leading-6 text-foreground focus:border-primary/50 focus:outline-none"
                        placeholder="Notification body"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Variables</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">Click a variable to insert it into the body.</p>
                      </div>
                      <div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
                        Current template: <span className="font-bold text-foreground">{selectedType.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(VARIABLES_HELP[selectedType] || []).map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => handleInsertVariable(variable)}
                          className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-mono font-bold text-primary transition-all hover:border-primary/30 hover:bg-primary/10"
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/[0.04] p-4">
                    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Preview</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">Rendered with sample values from the current signal flow.</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'push', label: 'Push', icon: Smartphone },
                          { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                          { key: 'telegram', label: 'Telegram', icon: Send },
                        ].map((mode) => {
                          const Icon = mode.icon;
                          return (
                            <button
                              key={mode.key}
                              type="button"
                              onClick={() => setPreviewMode(mode.key)}
                              className={clsx(
                                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-all',
                                previewMode === mode.key
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
                              )}
                            >
                              <Icon size={12} />
                              {mode.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div
                        className={clsx(
                          'rounded-3xl border p-4 shadow-sm',
                          previewMode === 'push' && 'border-primary/20 bg-slate-950 text-slate-50',
                          previewMode === 'whatsapp' && 'border-emerald-500/20 bg-[#0f1f17] text-slate-50',
                          previewMode === 'telegram' && 'border-sky-500/20 bg-[#12202b] text-slate-50'
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/70">
                          <span className="inline-flex items-center gap-2">
                            {previewMode === 'push' ? <Bell size={12} /> : null}
                            {previewMode === 'whatsapp' ? <MessageCircle size={12} /> : null}
                            {previewMode === 'telegram' ? <Send size={12} /> : null}
                            MSPK Trade Solutions
                          </span>
                          <span>Now</span>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <h4 className="text-sm font-bold">{previewTitle}</h4>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/85">{previewBody}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Delivery Notes</div>
                        <ul className="mt-3 space-y-3 text-[11px] leading-5 text-muted-foreground">
                          <li>Email signal alerts reuse the same rendered title and body with an HTML wrapper.</li>
                          <li>Push and WhatsApp use the same saved templates from this editor.</li>
                          <li>Telegram broadcast also uses these template strings after variable replacement.</li>
                          <li>In-app notifications use title, message, type, link, and data from the backend notification model.</li>
                          <li>Keep templates concise so they remain readable on phones and notification trays.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTemplates;
