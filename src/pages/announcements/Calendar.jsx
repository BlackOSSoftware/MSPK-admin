import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar as CalendarIcon, Filter, Check,
    Clock, X, Search, ChevronRight,
    ChevronLeft, ChevronDown, CalendarDays, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { fetchCalendarEvents } from '../../api/economic.api';

// --- Constants & Config ---

const IMPACT_LEVELS = [
    { id: 'high', label: 'High', color: 'bg-red-500', text: 'text-red-500' },
    { id: 'medium', label: 'Medium', color: 'bg-orange-500', text: 'text-orange-500' },
    { id: 'low', label: 'Low', color: 'bg-yellow-500', text: 'text-yellow-500' },
    { id: 'none', label: 'None', color: 'bg-slate-400', text: 'text-slate-400' },
];

const CURRENCIES = ['AUD', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'INR', 'JPY', 'NZD', 'USD', 'SGD', 'AED', 'HKD', 'BRL', 'MXN', 'RUB', 'ZAR'];

const CURRENCY_NAMES = {
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    EUR: 'Euro',
    GBP: 'British Pound',
    INR: 'Indian Rupee',
    JPY: 'Japanese Yen',
    NZD: 'New Zealand Dollar',
    USD: 'US Dollar',
    SGD: 'Singapore Dollar',
    AED: 'UAE Dirham',
    HKD: 'Hong Kong Dollar',
    BRL: 'Brazilian Real',
    MXN: 'Mexican Peso',
    RUB: 'Russian Ruble',
    ZAR: 'South African Rand',
};

const EVENT_TYPES = [
    'Growth', 'Inflation', 'Employment', 'Central Bank',
    'Bonds', 'Housing', 'Consumer Surveys', 'Business Surveys', 'Speeches', 'Misc'
];

// --- Mock Data with ISO Dates ---
// Mock Context: Today is 2025-12-15 (Monday)

// Mock Data removed - using real API data

// --- Skeleton Loader Component ---

const SkeletonRow = () => (
    <div className="grid grid-cols-11 gap-2 p-3 text-[11px] items-center border-b border-border animate-pulse">
        <div className="col-span-2 md:col-span-1 pl-2">
            <div className="h-3 w-8 bg-muted rounded"></div>
        </div>
        <div className="col-span-1 flex justify-center">
            <div className="h-3 w-8 bg-muted rounded"></div>
        </div>
        <div className="col-span-1 flex justify-center">
            <div className="h-4 w-4 rounded bg-muted"></div>
        </div>
        <div className="col-span-4 md:col-span-5 pr-2">
            <div className="h-3 w-3/4 bg-muted rounded"></div>
        </div>
        <div className="col-span-1">
            <div className="h-3 w-8 bg-muted rounded ml-auto"></div>
        </div>
        <div className="col-span-1">
            <div className="h-3 w-8 bg-muted rounded ml-auto"></div>
        </div>
        <div className="col-span-1">
            <div className="h-3 w-8 bg-muted rounded ml-auto"></div>
        </div>
    </div>
);

// --- Filter Components ---

const FilterCheckbox = ({ label, color, checked, onChange, isColorIcon = false }) => (
    <button
        onClick={onChange}
        className={clsx(
            "flex items-center gap-2 text-[11px] font-medium transition-colors p-2 rounded-lg hover:bg-white/5 w-full",
            checked ? "bg-primary/5 text-primary" : "text-muted-foreground"
        )}
    >
        <div className={clsx(
            "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
            checked ? "bg-primary border-primary text-black" : "border-slate-700 bg-transparent"
        )}>
            {checked && <Check size={12} strokeWidth={4} />}
        </div>

        {isColorIcon && color && (
            <div className={`w-3 h-3 rounded-full shrink-0 ${color}`}></div>
        )}

        <span className="truncate">{label}</span>
    </button>
);

const FilterDialog = ({
    isOpen, onClose,
    selectedImpacts, setSelectedImpacts,
    selectedCurrencies, setSelectedCurrencies,
    selectedEventTypes, setSelectedEventTypes
}) => {
    if (!isOpen) return null;

    const toggleFilter = (set, item) => {
        set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const toggleAll = (set, allItems) => {
        set(prev => prev.length === allItems.length ? [] : allItems);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[800px] h-[600px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Close Button Absolute */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-border bg-muted/20">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-3">
                        <Filter size={20} className="text-primary" />
                        Configure Calendar Filters
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Select the specific data points you want to see in the calendar.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-8 custom-scrollbar">
                    {/* Impact */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground/70 uppercase tracking-wider border-b border-border pb-2 mb-2">
                            <span>Impact</span>
                            <div className="flex gap-2 text-[10px] text-primary cursor-pointer tabular-nums">
                                <span onClick={() => toggleAll(setSelectedImpacts, IMPACT_LEVELS.map(i => i.id))}>All</span>
                                <span onClick={() => setSelectedImpacts([])} className="text-muted-foreground hover:text-foreground">None</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {IMPACT_LEVELS.map(impact => (
                                <FilterCheckbox
                                    key={impact.id}
                                    label={impact.label}
                                    color={impact.color}
                                    isColorIcon={true}
                                    checked={selectedImpacts.includes(impact.id)}
                                    onChange={() => toggleFilter(setSelectedImpacts, impact.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Currencies */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground/70 uppercase tracking-wider border-b border-border pb-2 mb-2">
                            <span>Currencies</span>
                            <div className="flex gap-2 text-[10px] text-primary cursor-pointer tabular-nums">
                                <span onClick={() => toggleAll(setSelectedCurrencies, CURRENCIES)}>All</span>
                                <span onClick={() => setSelectedCurrencies([])} className="text-muted-foreground hover:text-foreground">None</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {CURRENCIES.map(curr => (
                                <FilterCheckbox
                                    key={curr}
                                    label={curr}
                                    checked={selectedCurrencies.includes(curr)}
                                    onChange={() => toggleFilter(setSelectedCurrencies, curr)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Types */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground/70 uppercase tracking-wider border-b border-border pb-2 mb-2">
                            <span>Categories</span>
                            <div className="flex gap-2 text-[10px] text-primary cursor-pointer tabular-nums">
                                <span onClick={() => toggleAll(setSelectedEventTypes, EVENT_TYPES)}>All</span>
                                <span onClick={() => setSelectedEventTypes([])} className="text-muted-foreground hover:text-foreground">None</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {EVENT_TYPES.map(type => (
                                <FilterCheckbox
                                    key={type}
                                    label={type}
                                    checked={selectedEventTypes.includes(type)}
                                    onChange={() => toggleFilter(setSelectedEventTypes, type)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            setSelectedImpacts(IMPACT_LEVELS.map(i => i.id));
                            setSelectedCurrencies(CURRENCIES);
                            setSelectedEventTypes(EVENT_TYPES);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        Reset Default
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Date Navigator Component ---

const DateNavigatorDialog = ({ isOpen, onClose, selectedDateRange, onSelect }) => {
    if (!isOpen) return null;

    const today = new Date();
    const formatDateShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const links = [
        { label: 'Today', sub: formatDateShort(today), id: 'today' },
        { label: 'Tomorrow', sub: formatDateShort(new Date(new Date().setDate(today.getDate() + 1))), id: 'tomorrow' },
        { label: 'This Week', sub: '', id: 'thisWeek' },
        { label: 'Next Week', sub: '', id: 'nextWeek' },
        { label: 'This Month', sub: '', id: 'month' },
        { label: 'Yesterday', sub: formatDateShort(new Date(new Date().setDate(today.getDate() - 1))), id: 'yesterday' },
        { label: 'Last Week', sub: '', id: 'lastWeek' },
    ];

    const handleSelect = (id, label) => {
        onSelect({ id, label });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[320px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <CalendarDays size={16} className="text-primary" />
                        Select Date Range
                    </h3>
                </div>

                <div className="p-2 space-y-1">
                    {links.map(link => (
                        <button
                            key={link.id}
                            onClick={() => handleSelect(link.id, link.label + (link.sub ? ` (${link.sub})` : ''))}
                            className={clsx(
                                "w-full text-left px-3 py-2.5 rounded-lg text-xs group transition-all flex justify-between items-center",
                                selectedDateRange.id === link.id
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {selectedDateRange.id === link.id && <div className="w-1 h-1 rounded-full bg-primary" />}
                                {link.label}
                            </span>
                            {link.sub && <span className="text-[10px] opacity-60 group-hover:opacity-100 transition-opacity font-mono tabular-nums">{link.sub}</span>}
                        </button>
                    ))}
                </div>

                <div className="p-3 border-t border-border bg-muted/10 flex justify-end">
                    <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors font-bold uppercase tracking-wide">Close</button>
                </div>
            </div>
        </div>
    )
}

// --- Main Page Component ---

const CalendarPage = () => {
    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter Selections
    const [selectedImpacts, setSelectedImpacts] = useState(['high', 'medium', 'low', 'none']);
    const [selectedCurrencies, setSelectedCurrencies] = useState(CURRENCIES);
    const [selectedEventTypes, setSelectedEventTypes] = useState(EVENT_TYPES);

    // Date State (Dynamic)
    const getWeekLabel = () => {
        const today = new Date();
        const day = today.getDay();
        const first = today.getDate() - day + (day === 0 ? -6 : 1);
        const last = first + 6;
        const fromDate = new Date(today.setDate(first));
        const toDate = new Date(today.setDate(last));
        const format = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `This Week (${format(fromDate)}-${format(toDate)})`;
    };

    const [selectedDateRange, setSelectedDateRange] = useState({
        id: 'thisWeek',
        label: getWeekLabel()
    });


    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Data
    useEffect(() => {
        fetchEvents();
    }, [selectedDateRange]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            // Calculate date range based on selectedDateRange.id
            const today = new Date();
            let from = new Date();
            let to = new Date();

            switch (selectedDateRange.id) {
                case 'today':
                    break; // from/to are today
                case 'tomorrow':
                    from.setDate(today.getDate() + 1);
                    to.setDate(today.getDate() + 1);
                    break;
                case 'thisWeek':
                    {
                        const day = today.getDay();
                        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                        from.setDate(diff);
                        to = new Date(from);
                        to.setDate(from.getDate() + 6);
                    }
                    break;
                case 'nextWeek':
                    {
                        const day = today.getDay();
                        const diff = today.getDate() - day + (day === 0 ? -6 : 1) + 7;
                        from.setDate(diff);
                        to = new Date(from);
                        to.setDate(from.getDate() + 6);
                    }
                    break;
                case 'yesterday':
                    from.setDate(today.getDate() - 1);
                    to.setDate(today.getDate() - 1);
                    break;
                case 'month':
                    from = new Date(today.getFullYear(), today.getMonth(), 1);
                    to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case 'lastWeek':
                    {
                        const day = today.getDay();
                        const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
                        from.setDate(diff);
                        to = new Date(from);
                        to.setDate(from.getDate() + 6);
                    }
                    break;
                default:
                    {
                        const d = today.getDay();
                        const df = today.getDate() - d + (d === 0 ? -6 : 1);
                        from.setDate(df);
                        to = new Date(from);
                        to.setDate(from.getDate() + 6);
                    }
                    break;
            }

            const fromStr = from.toISOString().split('T')[0];
            const toStr = to.toISOString().split('T')[0];

            const response = await fetchCalendarEvents({ from: fromStr, to: toStr });

            // Augment data with UI-specific fields
            const augmentedData = response.data.map(evt => ({
                ...evt,
                id: evt._id, // Ensure ID is present for key
                dateIso: evt.date
            }));

            setEvents(augmentedData);
        } catch (error) {
            console.error("Failed to fetch calendar events", error);
            // toast.error("Failed to load calendar data");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to format date header
    const formatDate = (dateIso) => {
        const d = new Date(dateIso);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // Data Filtering Logic
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            // 1. Text Search
            const matchesSearch = searchTerm === '' ||
                e.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.country && e.country.toLowerCase().includes(searchTerm.toLowerCase()));

            // 2. Filters
            const impactLower = e.impact ? e.impact.toLowerCase() : 'none';
            const matchesImpact = selectedImpacts.includes(impactLower);

            const currency = e.currency || e.country || 'USD'; // Fallback
            const matchesCurrency = selectedCurrencies.includes(currency);

            return matchesSearch && matchesImpact && matchesCurrency;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [searchTerm, selectedImpacts, selectedCurrencies, events]);

    // Grouping by Date for headers
    const groupedEvents = useMemo(() => {
        const groups = {};
        filteredEvents.forEach(event => {
            // Backend date is full ISO string. Extract YYYY-MM-DD for grouping key.
            const dateKey = new Date(event.date).toISOString().split('T')[0];
            if (!groups[dateKey]) groups[dateKey] = [];

            // Augment event with display time
            const d = new Date(event.date);
            const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

            groups[dateKey].push({ ...event, time: timeStr, dateIso: dateKey });
        });
        return groups;
    }, [filteredEvents]);

    return (
        <div className="h-full flex flex-col gap-2 relative">

            {/* --- Standardized Toolbar --- */}
            <div className="flex items-center justify-between shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                        <CalendarIcon size={16} className="text-primary" />
                        Economic Calendar
                    </h2>

                    <div className="h-6 w-[1px] bg-border"></div>

                    <button
                        onClick={() => setIsDateOpen(true)}
                        className="flex items-center gap-2 text-xs font-bold text-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors"
                    >
                        <CalendarDays size={14} className="text-primary" />
                        <span className="uppercase">{selectedDateRange.label}</span>
                        <ChevronDown size={12} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mr-2 font-mono bg-muted/50 px-2 py-1 rounded">
                        <Clock size={10} /> GMT+05:30
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="h-8 px-3 rounded-lg border border-border flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors bg-muted/30 uppercase tracking-wide"
                    >
                        <Filter size={12} />
                        Filter Data
                        {(selectedImpacts.length < IMPACT_LEVELS.length || selectedCurrencies.length < CURRENCIES.length) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-1" />
                        )}
                    </button>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="SEARCH EVENT..."
                            className="bg-muted/30 border border-border h-8 pl-9 pr-3 w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-muted/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50 text-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* --- Main Table Area --- */}
            <div className="flex-1 min-h-0 bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col relative w-full">
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />

                {/* Table Header */}
                <div className="grid grid-cols-11 gap-2 bg-muted/50 p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border sticky top-0 z-20 backdrop-blur-md">
                    <div className="col-span-2 md:col-span-1 pl-2">Time</div>
                    <div className="col-span-1 text-center">Curr</div>
                    <div className="col-span-1 text-center">Imp</div>
                    <div className="col-span-4 md:col-span-5">Event</div>
                    <div className="col-span-1 text-right">Actual</div>
                    <div className="col-span-1 text-right">Forecast</div>
                    <div className="col-span-1 text-right">Previous</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {isLoading ? (
                        Array.from({ length: 15 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : Object.keys(groupedEvents).length > 0 ? (
                        Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a)).map(dateIso => (
                            <div key={dateIso}>
                                {/* Sticky Date Header */}
                                <div className="bg-muted px-4 py-2 text-xs font-bold text-primary border-y border-border sticky top-0 backdrop-blur-sm z-10 w-full flex items-center gap-2">
                                    <ChevronRight size={12} /> {formatDate(dateIso)}
                                </div>

                                {groupedEvents[dateIso].map((event) => (
                                    <div key={event.id} className="flex flex-col border-b border-border transition-colors">
                                        <div
                                            className={clsx(
                                                "grid grid-cols-11 gap-2 p-3 text-[11px] items-center transition-colors select-none",
                                                "hover:bg-muted/50"
                                            )}
                                        >

                                            {/* Time */}
                                            <div className="col-span-2 md:col-span-1 pl-2 font-mono text-foreground/70 border-l-2 border-transparent group-hover:border-primary transition-all flex items-center gap-2 tabular-nums">
                                                {event.time}
                                            </div>

                                            {/* Currency */}
                                            <div
                                                className="col-span-1 text-center font-bold text-foreground/90"
                                                title={CURRENCY_NAMES[event.currency] || event.currency}
                                            >
                                                {event.currency}
                                            </div>

                                            {/* Impact Icon */}
                                            <div
                                                className="col-span-1 flex justify-center"
                                                title={(IMPACT_LEVELS.find(i => i.id === (event.impact || 'none').toLowerCase()) || {}).label + " Impact"}
                                            >
                                                <div className={clsx(
                                                    "w-4 h-4 rounded shadow-sm border border-black/10",
                                                    (IMPACT_LEVELS.find(i => i.id === (event.impact || 'none').toLowerCase()) || {}).color
                                                )}></div>
                                            </div>

                                            {/* Event Name */}
                                            <div
                                                className="col-span-4 md:col-span-5 font-semibold text-foreground/80 truncate pr-2"
                                                title={event.detail || event.event}
                                            >
                                                {event.event}
                                            </div>

                                            {/* Actual */}
                                            <div
                                                className={clsx(
                                                    "col-span-1 text-right font-mono font-bold tabular-nums",
                                                    event.pending ? "text-muted-foreground" : (
                                                        event.impactType === 'positive' ? "text-emerald-500" :
                                                            event.impactType === 'negative' ? "text-red-500" : "text-foreground"
                                                    )
                                                )}
                                                title="Actual Value"
                                            >
                                                {event.actual || '-'}
                                            </div>

                                            {/* Forecast */}
                                            <div className="col-span-1 text-right font-mono text-muted-foreground font-medium tabular-nums" title="Forecast">
                                                {event.forecast || '-'}
                                            </div>

                                            {/* Previous */}
                                            <div className="col-span-1 text-right font-mono text-muted-foreground font-medium tabular-nums" title="Previous">
                                                {event.previous || '-'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 animate-in fade-in duration-500 bg-background/50">
                            <div className="p-4 rounded-full bg-muted">
                                <Activity size={40} className="opacity-20 text-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-foreground/80">No events found</p>
                                <p className="text-[10px] opacity-60">Try adjusting your filters or date range.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedImpacts(IMPACT_LEVELS.map(i => i.id));
                                    setSelectedCurrencies(CURRENCIES);
                                    setSearchTerm('');
                                }}
                                className="text-[11px] font-bold text-primary hover:underline px-4 py-2 rounded-lg bg-primary/5 border border-primary/20"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <FilterDialog
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                selectedImpacts={selectedImpacts}
                setSelectedImpacts={setSelectedImpacts}
                selectedCurrencies={selectedCurrencies}
                setSelectedCurrencies={setSelectedCurrencies}
                selectedEventTypes={selectedEventTypes}
                setSelectedEventTypes={setSelectedEventTypes}
            />

            <DateNavigatorDialog
                isOpen={isDateOpen}
                onClose={() => setIsDateOpen(false)}
                selectedDateRange={selectedDateRange}
                onSelect={setSelectedDateRange}
            />
        </div>
    );
};

export default CalendarPage;
