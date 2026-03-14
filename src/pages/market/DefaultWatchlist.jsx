import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getAllSettings, updateBulkSettings } from '../../api/settings.api';
import { searchInstruments } from '../../api/market.api';
import useToast from '../../hooks/useToast';

const DEFAULT_WATCHLIST_SETTING_KEY = 'default_market_watchlist_symbols';

const normalizeSymbols = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );

const DefaultWatchlist = () => {
  const toast = useToast();
  const [symbols, setSymbols] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllSettings();
      setSymbols(normalizeSymbols(data?.[DEFAULT_WATCHLIST_SETTING_KEY] || []));
    } catch (error) {
      console.error('Failed to load default watchlist settings', error);
      toast.error('Failed to load default watchlist settings');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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

  const symbolSet = useMemo(() => new Set(symbols), [symbols]);

  const addSymbol = (symbol) => {
    const normalized = String(symbol || '').trim().toUpperCase();
    if (!normalized || symbolSet.has(normalized)) return;
    setSymbols((prev) => [...prev, normalized]);
    setSearchTerm('');
    setResults([]);
  };

  const removeSymbol = (symbol) => {
    setSymbols((prev) => prev.filter((item) => item !== symbol));
  };

  const moveSymbol = (index, direction) => {
    setSymbols((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      await updateBulkSettings({
        [DEFAULT_WATCHLIST_SETTING_KEY]: symbols,
      });
      toast.success('Default watchlist saved successfully');
    } catch (error) {
      console.error('Failed to save default watchlist', error);
      toast.error('Failed to save default watchlist');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    {
      label: 'Default Symbols',
      value: symbols.length,
      note: symbols.length ? 'Visible to every new signup on first load' : 'Start building the first-time list',
      icon: LayoutList,
    },
    {
      label: 'First Experience',
      value: symbols.length ? 'Ready' : 'Pending',
      note: 'Users can still remove any symbol later from their personal watchlist.',
      icon: ShieldCheck,
    },
    {
      label: 'Admin Control',
      value: 'Live',
      note: 'Search, arrange, and publish the exact order you want new users to see.',
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
                Default New User Watchlist
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                Build the exact first watchlist experience every new user should see. Admin-selected symbols appear on
                first load, in the same order you save here, while users still stay free to remove or personalize them later.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:w-auto xl:min-w-[22rem]">
              <Button
                variant="outline"
                className="h-11 w-full gap-2 whitespace-nowrap px-4 text-sm"
                onClick={loadConfig}
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Button
                className="h-11 w-full gap-2 whitespace-normal px-4 text-sm leading-5 min-[420px]:whitespace-nowrap"
                onClick={saveConfig}
                disabled={isSaving}
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : 'Save Default Watchlist'}
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
                <Search size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">Add Symbols</h2>
                <p className="mt-1 text-xs text-muted-foreground">Search the market and curate the starter list.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <ArrowUpRight size={12} />
              New-user onboarding control
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
                          disabled={alreadyAdded}
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
                  Search for any symbol and add it to the default watchlist new users receive on their first visit.
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
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">Current Default Symbols</h2>
                <p className="mt-1 text-xs text-muted-foreground">This order is the exact sequence shown to new users.</p>
              </div>
            </div>
            <div className="rounded-full border border-border/70 bg-secondary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {symbols.length} Symbols
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {symbols.length > 0 ? (
              symbols.map((symbol, index) => (
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
                      This symbol will appear in position {index + 1} for a first-time user watchlist.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button size="sm" variant="outline" disabled={index === 0} onClick={() => moveSymbol(index, -1)}>
                      Up
                    </Button>
                    <Button size="sm" variant="outline" disabled={index === symbols.length - 1} onClick={() => moveSymbol(index, 1)}>
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
                No symbols have been added yet. Start from the search panel and create a polished default watchlist for every new user.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DefaultWatchlist;
