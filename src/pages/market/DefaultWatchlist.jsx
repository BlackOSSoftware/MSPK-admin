import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GripVertical,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Plus,
  LayoutList,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  FolderPlus,
  Layers,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  createWatchlistTemplate,
  deleteWatchlistTemplate,
  getWatchlistTemplates,
  searchInstruments,
  updateWatchlistTemplate,
} from '../../api/market.api';
import useToast from '../../hooks/useToast';

const normalizeSymbols = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );

const resolveTemplateSegmentLabel = (template) => {
  if (!template) return 'Unknown';
  const selector = template.selector || {};
  const bucket = String(selector.bucket || '').trim().toUpperCase();
  if (bucket === 'COMEX') return 'Comex';
  if (bucket === 'FOREX') return 'Currency';
  const segments = Array.isArray(selector.segments) ? selector.segments : [];
  const primary = segments[0] ? String(segments[0]).trim().toUpperCase() : '';
  if (!bucket && segments.length === 0) return 'Manual';
  return primary ? primary : 'Manual';
};

const DefaultWatchlist = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const lastSavedSymbolsRef = useRef(new Map());
  const autosaveTimerRef = useRef(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWatchlistTemplates({ includeInactive: 'true' });
      const sorted = Array.isArray(data)
        ? [...data].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        : [];
      setTemplates(sorted);
      const nextSaved = new Map();
      sorted.forEach((item) => {
        nextSaved.set(item._id, normalizeSymbols(item.preferredSymbols || []));
      });
      lastSavedSymbolsRef.current = nextSaved;
      if (sorted.length > 0 && !activeTemplateId) {
        setActiveTemplateId(sorted[0]._id);
      } else if (sorted.length === 0) {
        setActiveTemplateId('');
      }
    } catch (error) {
      console.error('Failed to load watchlist templates', error);
      toast.error('Failed to load watchlist templates');
    } finally {
      setIsLoading(false);
    }
  }, [toast, activeTemplateId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchInstruments(trimmed);
        setResults(Array.isArray(response) ? response.slice(0, 12) : []);
      } catch (error) {
        console.error('Failed to search symbols', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const activeTemplate = useMemo(
    () => templates.find((item) => item._id === activeTemplateId) || null,
    [templates, activeTemplateId]
  );

  const preferredSymbols = useMemo(
    () => normalizeSymbols(activeTemplate?.preferredSymbols ?? []),
    [activeTemplate]
  );

  const symbolSet = useMemo(() => new Set(preferredSymbols), [preferredSymbols]);

  const addSymbol = (symbol) => {
    const normalized = String(symbol || '').trim().toUpperCase();
    if (!normalized || symbolSet.has(normalized) || !activeTemplate) return;
    setTemplates((prev) =>
      prev.map((item) =>
        item._id === activeTemplate._id
          ? { ...item, preferredSymbols: [...preferredSymbols, normalized] }
          : item
      )
    );
    setSearchTerm('');
    setResults([]);
  };

  const removeSymbol = (symbol) => {
    if (!activeTemplate) return;
    setTemplates((prev) =>
      prev.map((item) =>
        item._id === activeTemplate._id
          ? { ...item, preferredSymbols: preferredSymbols.filter((s) => s !== symbol) }
          : item
      )
    );
  };

  const moveSymbol = (index, direction) => {
    if (!activeTemplate) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= preferredSymbols.length) return;
    const next = [...preferredSymbols];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setTemplates((prev) =>
      prev.map((entry) =>
        entry._id === activeTemplate._id ? { ...entry, preferredSymbols: next } : entry
      )
    );
  };

  const saveTemplate = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    try {
      await updateWatchlistTemplate(activeTemplate._id, {
        preferredSymbols,
      });
      lastSavedSymbolsRef.current.set(activeTemplate._id, [...preferredSymbols]);
      toast.success('Folder symbols saved');
      await loadTemplates();
    } catch (error) {
      console.error('Failed to save folder symbols', error);
      toast.error('Failed to save folder symbols');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!activeTemplate) return;
    const lastSaved = lastSavedSymbolsRef.current.get(activeTemplate._id) || [];
    if (JSON.stringify(lastSaved) === JSON.stringify(preferredSymbols)) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateWatchlistTemplate(activeTemplate._id, { preferredSymbols });
        lastSavedSymbolsRef.current.set(activeTemplate._id, [...preferredSymbols]);
        toast.success('Folder auto-saved');
      } catch (error) {
        console.error('Auto-save failed', error);
        toast.error('Auto-save failed');
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [activeTemplate, preferredSymbols, toast]);

  const createFolder = async () => {
    const name = String(newFolderName || '').trim();
    if (!name) {
      toast.error('Folder name is required');
      return;
    }

    setIsCreating(true);
    try {
      const maxOrder = templates.reduce((acc, item) => Math.max(acc, Number(item.order || 0)), 0);
      const created = await createWatchlistTemplate({
        name,
        order: maxOrder + 10,
        preferredSymbols: [],
      });
      toast.success('Folder created');
      setNewFolderName('');
      setTemplates((prev) => [...prev, created]);
      setActiveTemplateId(created._id);
      lastSavedSymbolsRef.current.set(created._id, []);
    } catch (error) {
      console.error('Failed to create folder', error);
      toast.error('Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteFolder = async () => {
    if (!activeTemplate) return;
    const confirmed = window.confirm(`Delete folder "${activeTemplate.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteWatchlistTemplate(activeTemplate._id);
      toast.success('Folder deleted');
      const remaining = templates.filter((item) => item._id !== activeTemplate._id);
      setTemplates(remaining);
      setActiveTemplateId(remaining[0]?._id || '');
      lastSavedSymbolsRef.current.delete(activeTemplate._id);
    } catch (error) {
      console.error('Failed to delete folder', error);
      toast.error('Failed to delete folder');
    }
  };

  const stats = [
    {
      label: 'Folders',
      value: templates.length,
      note: 'Each folder becomes a default watchlist for every user.',
      icon: Layers,
    },
    {
      label: 'Selected Folder',
      value: activeTemplate?.name || 'None',
      note: activeTemplate
        ? `Type: ${resolveTemplateSegmentLabel(activeTemplate)}`
        : 'Create a folder to begin.',
      icon: ShieldCheck,
    },
    {
      label: 'Default Behavior',
      value: 'All + Folders',
      note: 'Users see All plus every admin folder. Admin symbols are locked; users can add extras.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-5">
      <Card className="relative overflow-hidden border-border/70 bg-card/95">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_right,rgba(16,185,129,0.15),transparent_32%)]" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                <Sparkles size={12} />
                Market Defaults
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Default Watchlist Folders
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                Create folders, add default symbols, and publish the exact structure every user will see on first load.
                Users can add extra symbols, but admin symbols stay locked.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:w-auto xl:min-w-[22rem]">
              <Button
                variant="outline"
                className="h-11 w-full gap-2 whitespace-nowrap px-4 text-sm"
                onClick={loadTemplates}
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Button
                className="h-11 w-full gap-2 whitespace-normal px-4 text-sm leading-5 min-[420px]:whitespace-nowrap"
                onClick={saveTemplate}
                disabled={isSaving || !activeTemplate}
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : 'Save Folder'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {stats.map(({ label, value, note, icon: Icon }) => (
              <div
                key={label}
                className="rounded-3xl border border-border/70 bg-background/65 p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.65)] backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    <div className="mt-2 text-2xl font-black text-foreground">{value}</div>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.08fr]">
        <Card className="border-border/70 bg-card/95">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                <FolderPlus size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">Folders</h2>
                <p className="mt-1 text-xs text-muted-foreground">Create and select the segment folder you want to edit.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {templates.length} Total
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(148,163,184,0.08),rgba(148,163,184,0.03))] p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="Folder name"
                  className="h-11 rounded-2xl border border-border/70 bg-secondary/15 px-4 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none"
                />
                <Button className="h-11 gap-2" onClick={createFolder} disabled={isCreating}>
                  <Plus size={14} />
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Each folder becomes a default watchlist for users. All + these folders show by default.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-background/50 p-3 sm:p-4">
              {templates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-10 text-center text-sm text-muted-foreground">
                  No folders yet. Create a segment folder to start.
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template._id}
                      type="button"
                      onClick={() => setActiveTemplateId(template._id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        template._id === activeTemplateId
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-border/70 bg-card/80 text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{template.name}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {resolveTemplateSegmentLabel(template)}
                        </div>
                      </div>
                      <div className="rounded-full border border-border/70 bg-secondary/20 px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                        {(template.preferredSymbols || []).length} symbols
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-500">
                <LayoutList size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">Folder Symbols</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTemplate ? `Editing ${activeTemplate.name}` : 'Select a folder to manage symbols.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-border/70 bg-secondary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {preferredSymbols.length} Symbols
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-rose-500"
                onClick={deleteFolder}
                disabled={!activeTemplate}
              >
                <Trash2 size={12} />
                Delete Folder
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search symbols like NSE:RELIANCE, BTCUSD, USDINR..."
                className="h-12 w-full rounded-2xl border border-border/70 bg-secondary/15 pl-10 pr-4 text-sm text-foreground shadow-inner focus:border-primary/40 focus:outline-none"
                disabled={!activeTemplate}
              />
            </div>

            <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(148,163,184,0.08),rgba(148,163,184,0.03))] p-3 sm:p-4">
              {isSearching ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Searching symbols...</div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((item) => {
                    const symbol = String(item.symbol || '').trim().toUpperCase();
                    const alreadyAdded = symbolSet.has(symbol);
                    return (
                      <div
                        key={`${symbol}-${item.exchange || ''}`}
                        className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.8)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-sm font-bold text-foreground">{symbol}</div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {item.name || 'Unnamed symbol'} | {item.segment || 'N/A'} | {item.exchange || 'N/A'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1.5 self-start sm:self-auto"
                          disabled={alreadyAdded || !activeTemplate}
                          onClick={() => addSymbol(symbol)}
                        >
                          <Plus size={12} />
                          {alreadyAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-10 text-center text-sm text-muted-foreground">
                  Search for any symbol and add it to this folder.
                </div>
              )}
            </div>

            <div className="space-y-3">
              {preferredSymbols.length > 0 ? (
                preferredSymbols.map((symbol, index) => (
                  <div
                    key={symbol}
                    className="flex flex-col gap-3 rounded-[26px] border border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.03),rgba(15,23,42,0.01))] p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
                        <GripVertical size={14} />
                      </div>
                      <div className="grid h-10 min-w-[2.5rem] shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-sm font-black text-primary">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-semibold text-foreground">{symbol}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        This symbol appears in position {index + 1} for users in this folder.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveSymbol(index, -1)}>
                        Up
                      </Button>
                      <Button size="sm" variant="outline" disabled={index === preferredSymbols.length - 1} onClick={() => moveSymbol(index, 1)}>
                        Down
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-rose-500"
                        onClick={() => removeSymbol(symbol)}
                      >
                        <Trash2 size={12} />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-border/70 bg-secondary/15 px-4 py-12 text-center text-sm leading-6 text-muted-foreground">
                  No symbols in this folder yet. Add some from the search above.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DefaultWatchlist;
