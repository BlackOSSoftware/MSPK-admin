import { Plus, X, ChevronDown, ChevronRight, Trash2, Settings2, MoreHorizontal, Check, LayoutList, AlignJustify } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import SymbolLogo from './SymbolLogo';
import chartCache from '../../utils/ChartDataCache'; // Import Cache
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PipettePrice = ({ price, previousPrice, symbol }) => {
    if (!price) return <span>---</span>;
    // Determine precision based on symbol type or price magnitude
    const isForex = symbol?.includes('/') || (symbol?.length === 6 && !symbol?.includes('USDT'));
    const precision = isForex ? 5 : (price < 10 ? 4 : 2);

    const formatted = price.toFixed(precision);
    // TradingView style: Last 1 or 2 digits are small
    const pipCount = precision > 2 ? 1 : 0; // Only use pipette for high precision or specific logic
    const mainPart = pipCount > 0 ? formatted.slice(0, -1) : formatted;
    const pips = pipCount > 0 ? formatted.slice(-1) : '';

    const isUp = price >= (previousPrice || price);
    const colorClass = isUp ? 'text-up' : 'text-down';

    return (
        <span className={`font-mono font-bold tracking-tight ${colorClass}`}>
            {mainPart}
            {pips && <span className="text-[0.7em] align-top relative -top-[1px] ml-[0.5px] opacity-90">{pips}</span>}
        </span>
    );
};

// Watchlist Settings Popover Component
const WatchlistSettings = ({ settings, onSettingsChange, onClose, isOpen, anchorRef }) => {
    if (!isOpen) return null;

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (anchorRef.current && !anchorRef.current.contains(event.target) && !event.target.closest('.settings-popover')) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [anchorRef, onClose]);

    const toggleColumn = (key) => {
        onSettingsChange({
            ...settings,
            columns: { ...settings.columns, [key]: !settings.columns[key] }
        });
    };

    const toggleShow = (key) => {
        onSettingsChange({
            ...settings,
            show: { ...settings.show, [key]: !settings.show[key] }
        });
    };

    const style = {
        top: anchorRef.current ? anchorRef.current.offsetHeight + 10 : 40,
        right: 0
    };

    return (
        <div className="absolute right-2 z-50 w-64 bg-card border border-border rounded-lg shadow-xl settings-popover flex flex-col text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150" style={style}>
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                <span className="font-semibold text-foreground">View Settings</span>
            </div>

            <div className="p-2 space-y-1">
                {/* Table View Toggle */}
                <div
                    className="flex items-center justify-between p-2 hover:bg-accent/50 rounded cursor-pointer"
                    onClick={() => onSettingsChange({ ...settings, tableView: !settings.tableView })}
                >
                    <span className="flex items-center gap-2">
                        {settings.tableView ? <LayoutList size={16} /> : <AlignJustify size={16} />}
                        Table View
                    </span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.tableView ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.tableView ? 'left-4.5' : 'left-0.5'}`} style={{ left: settings.tableView ? '18px' : '2px' }}></div>
                    </div>
                </div>

                <div className="h-px bg-border/50 my-1"></div>
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground/70">Columns</div>

                {/* Columns */}
                {['last', 'change', 'changePercent', 'volume'].map(col => (
                    <div
                        key={col}
                        className="flex items-center gap-2 p-2 hover:bg-accent/50 rounded cursor-pointer"
                        onClick={() => toggleColumn(col)}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${settings.columns[col] ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
                            {settings.columns[col] && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="capitalize">{col.replace(/([A-Z])/g, ' $1').trim().replace('Percent', ' %')}</span>
                    </div>
                ))}

                <div className="h-px bg-border/50 my-1"></div>
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground/70">Symbol Display</div>

                {/* Show Options */}
                {['logo', 'ticker', 'description'].map(opt => (
                    <div
                        key={opt}
                        className="flex items-center gap-2 p-2 hover:bg-accent/50 rounded cursor-pointer"
                        onClick={() => toggleShow(opt)}
                    >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.show[opt] ? 'border-primary' : 'border-muted-foreground/40'}`}>
                            {settings.show[opt] && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                        </div>
                        <span className="capitalize">{opt}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Sortable Row Component
const SortableRow = ({ item, selectedSymbol, onSelect, onRemoveSymbol, settings }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.symbol });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : 'auto',
        position: 'relative'
    };

    const isPositive = (item.change || 0) >= 0;
    const isSelected = selectedSymbol?.symbol === item.symbol;
    const changeVal = item.change ? item.change.toFixed(item.price < 100 ? 4 : 2) : '0.00';
    const changePrefix = isPositive ? '+' : '';

    // Smart Volume Formatter
    const formatVolume = (val) => {
        if (val === undefined || val === null || val === '') return '---';
        const v = parseFloat(val);
        if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
        if (v >= 1000) return (v / 1000).toFixed(2) + 'K';
        if (v < 1) return v.toFixed(5);
        if (v < 10) return v.toFixed(4);
        if (v < 100) return v.toFixed(2);
        return v.toFixed(0);
    };

    // Default settings fallback
    const show = settings?.show || { logo: true, ticker: true, description: false };
    const cols = settings?.columns || { last: true, change: true, changePercent: true, volume: false };
    const isTable = settings?.tableView;

    // Dynamic Grid Template for Table View - Proportional scaling
    const gridStyle = isTable ? {
        display: 'grid',
        gridTemplateColumns: `minmax(0, 2fr) ${cols.last ? '1fr ' : ''}${cols.change ? '1fr ' : ''}${cols.changePercent ? '1fr ' : ''}${cols.volume ? '1fr' : ''}`.trim(),
        gap: '12px',
        alignItems: 'center'
    } : {};

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...gridStyle }}
            onClick={() => onSelect(item)}
            {...attributes}
            {...listeners}
            className={`${isTable ? 'px-2 py-1 border-b border-border/30 text-[11px]' : 'flex items-center px-3 py-3 border-b border-border/40'} 
                cursor-grab active:cursor-grabbing transition-all duration-200 group relative overflow-hidden touch-none select-none
                ${isSelected ? 'bg-primary/10' : 'hover:bg-accent/40'}
            `}
        >
            {/* Selection Indicator */}
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}

            {/* Symbol Column */}
            <div className={`flex items-center gap-1.5 overflow-hidden min-w-0 pl-1 ${!isTable ? 'flex-1 pr-2' : ''}`}>
                {show.logo && (
                    <div className="flex-none flex items-center justify-center">
                        <SymbolLogo symbol={item.symbol} size={isTable ? 18 : 24} className="rounded-full shadow-sm" />
                    </div>
                )}
                <div className="flex flex-col truncate min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {show.ticker && (
                            <span className={`font-bold truncate tracking-tight ${isSelected ? 'text-primary' : 'text-foreground'} ${isTable ? 'text-[12px]' : 'text-[14px]'}`}>
                                {item.symbol}
                            </span>
                        )}
                        {/* TradingView Status Indicator Dot */}
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-none" />
                    </div>
                    {show.description && item.description && (
                        <span className="text-[10px] text-muted-foreground truncate opacity-60 font-medium">
                            {item.description}
                        </span>
                    )}
                </div>
            </div>

            {/* Columns Container */}
            {isTable ? (
                <>
                    {cols.last && (
                        <div className="text-right">
                            <PipettePrice price={parseFloat(item.price)} symbol={item.symbol} />
                        </div>
                    )}
                    {cols.change && (
                        <div className={`text-right font-mono font-bold tracking-tight ${isPositive ? 'text-up' : 'text-down'}`}>
                            {changePrefix}{changeVal}
                        </div>
                    )}
                    {cols.changePercent && (
                        <div className={`text-right font-bold tracking-tight ${isPositive ? 'text-up' : 'text-down'}`}>
                            {changePrefix}{(typeof item.changePercent === 'number' ? item.changePercent.toFixed(2) : item.changePercent)}%
                        </div>
                    )}
                    {cols.volume && (
                        <div className="text-right text-muted-foreground font-mono font-medium opacity-60">
                            {formatVolume(item.volume)}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex items-center gap-4 justify-end">
                    {cols.last && (
                        <div className="text-right min-w-[60px]">
                            <PipettePrice price={parseFloat(item.price)} symbol={item.symbol} />
                        </div>
                    )}

                    {cols.change && (
                        <div className="text-right w-[50px]">
                            <span className={`font-mono font-bold text-xs tracking-tight ${isPositive ? 'text-up' : 'text-down'}`}>
                                {changePrefix}{changeVal}
                            </span>
                        </div>
                    )}

                    {cols.changePercent && (
                        <div className="text-right w-[55px] relative">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${isPositive ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>
                                {changePrefix}{(typeof item.changePercent === 'number' ? item.changePercent.toFixed(2) : item.changePercent)}%
                            </span>
                        </div>
                    )}

                    {cols.volume && (
                        <div className="text-right min-w-[40px]">
                            <span className="text-[10px] text-muted-foreground font-mono font-medium opacity-60">
                                {formatVolume(item.volume)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Overlapping Delete Button */}
            {onRemoveSymbol && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSymbol(item);
                    }}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-500/20 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 bg-card/95 border border-border/50 shadow-sm
                        ${isTable ? 'scale-90' : 'scale-100'}
                    `}
                    title="Remove from Watchlist"
                >
                    <X size={14} strokeWidth={3} />
                </button>
            )}
        </div>
    );
};

// Sortable Category Component
const SortableCategory = ({ category, marketData, selectedSymbol, onSelect, onRemoveSymbol, isCollapsed, onToggleCollapse, onRemoveCategory, settings }) => {
    // ... (Hooks same as before)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `CAT-${category}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 30 : 'auto',
        position: 'relative'
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-0">
            {/* Category Header - TradingView Minimalist Style */}
            <div
                className="bg-muted/30 px-3 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wide sticky top-0 backdrop-blur-md flex items-center justify-between border-y border-border/40 z-10 transition-colors hover:bg-muted/50 group/cat"
            >
                <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing touch-none flex-1" {...attributes} {...listeners}>
                    <span
                        onClick={(e) => { e.stopPropagation(); onToggleCollapse(category); }}
                        className="cursor-pointer hover:text-foreground text-muted-foreground/40 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={10} strokeWidth={3} /> : <ChevronDown size={10} strokeWidth={3} />}
                    </span>
                    {category}
                    <span className="text-[9px] text-muted-foreground/50 font-medium ml-1">({marketData[category].length})</span>
                </div>

                {onRemoveCategory && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete entire category '${category}' and remove all its symbols?`)) {
                                onRemoveCategory(category);
                            }
                        }}
                        className="opacity-0 group-hover/cat:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                        title="Delete Category"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            {/* Symbols List */}
            {!isCollapsed && (
                <SortableContext
                    items={marketData[category].map(s => s.symbol)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className={settings?.tableView ? 'divide-y divide-border/20' : ''}>
                        {marketData[category].map(item => (
                            <SortableRow
                                key={item.symbol}
                                item={item}
                                selectedSymbol={selectedSymbol}
                                onSelect={onSelect}
                                onRemoveSymbol={onRemoveSymbol}
                                settings={settings}
                            />
                        ))}
                    </div>
                </SortableContext>
            )}
        </div>
    );
};

const TradingWatchlist = ({
    marketData,
    selectedSymbol,
    onSelect,
    onClose,
    onAddSymbol,
    onRemoveSymbol,
    onReorder,
    categoryOrder = [],
    onReorderCategories,
    onRemoveCategory,
    settings,
    onSettingsChange
}) => {
    // ... Sort Logic ...
    const availableCategories = Object.keys(marketData);
    const sortedCategories = [...availableCategories].sort((a, b) => {
        if (!categoryOrder.length) return 0;
        const idxA = categoryOrder.indexOf(a);
        const idxB = categoryOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        // ... (Same Logic) ...
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId.startsWith('CAT-') && overId.startsWith('CAT-')) {
            const oldIndex = sortedCategories.indexOf(activeId.replace('CAT-', ''));
            const newIndex = sortedCategories.indexOf(overId.replace('CAT-', ''));
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);
                if (onReorderCategories) onReorderCategories(newOrder);
            }
            return;
        }

        const activeCat = availableCategories.find(cat => marketData[cat].some(s => s.symbol === active.id));
        const overCat = availableCategories.find(cat => marketData[cat].some(s => s.symbol === over.id));

        if (activeCat && activeCat === overCat) {
            const oldIndex = marketData[activeCat].findIndex(s => s.symbol === active.id);
            const newIndex = marketData[activeCat].findIndex(s => s.symbol === over.id);
            const newCatOrder = arrayMove(marketData[activeCat], oldIndex, newIndex);

            const fullOrderedList = [];
            sortedCategories.forEach(cat => {
                const items = cat === activeCat ? newCatOrder : marketData[cat];
                items.forEach(s => fullOrderedList.push(s.symbol));
            });

            if (onReorder) onReorder(fullOrderedList);
        }
    };

    const [collapsed, setCollapsed] = React.useState(() => {
        try { return JSON.parse(localStorage.getItem('mspk_watchlist_collapsed')) || {}; } catch { return {}; }
    });

    const toggleCollapse = (cat) => {
        setCollapsed(prev => {
            const next = { ...prev, [cat]: !prev[cat] };
            localStorage.setItem('mspk_watchlist_collapsed', JSON.stringify(next));
            return next;
        });
    };

    // Settings Menu State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsBtnRef = useRef(null);

    // Derived Defaults
    const cols = settings?.columns || { last: true, change: true, changePercent: true, volume: false };
    const isTable = settings?.tableView;

    return (
        <div className="flex flex-col h-full bg-card font-sans text-xs relative">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-border bg-card z-20 sticky top-0">
                <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition group">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary">Watchlist</span>
                </div>
                <div className="flex gap-2 text-muted-foreground items-center">
                    <button
                        onClick={onAddSymbol}
                        className="p-1 hover:text-foreground hover:bg-muted rounded transition"
                        title="Add Symbol"
                    >
                        <Plus size={16} />
                    </button>

                    {/* Settings Button */}
                    <button
                        ref={settingsBtnRef}
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`p-1 rounded transition ${isSettingsOpen ? 'text-primary bg-primary/10' : 'hover:text-foreground hover:bg-muted'}`}
                        title="View Settings"
                    >
                        <Settings2 size={16} />
                    </button>

                    {onClose && (
                        <button onClick={onClose} className="hover:text-foreground transition md:hidden ml-1">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Settings Popover */}
            <WatchlistSettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                anchorRef={settingsBtnRef}
                settings={settings || {}}
                onSettingsChange={onSettingsChange}
            />

            {/* Column Headers (Conditional) - TradingView Style */}
            <div
                style={isTable ? {
                    display: 'grid',
                    gridTemplateColumns: `minmax(0, 2fr) ${cols.last ? '1fr ' : ''}${cols.change ? '1fr ' : ''}${cols.changePercent ? '1fr ' : ''}${cols.volume ? '1fr' : ''}`.trim(),
                    gap: '12px',
                    alignItems: 'center'
                } : {}}
                className={`${isTable ? 'px-2 py-0.5' : 'flex items-center px-3 py-1.5'} border-b border-border/40 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter select-none bg-muted/10`}
            >
                <div className="pl-1 truncate flex items-center gap-1">
                    Symbol
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/10" />
                </div>
                {isTable ? (
                    <>
                        {cols.last && <div className="text-right">Last</div>}
                        {cols.change && <div className="text-right">Chg</div>}
                        {cols.changePercent && <div className="text-right">Chg%</div>}
                        {cols.volume && <div className="text-right">Vol</div>}
                    </>
                ) : (
                    <div className="flex items-center gap-4 justify-end">
                        {cols.last && <div className="text-right min-w-[60px]">Last</div>}
                        {cols.change && <div className="text-right w-[50px]">Chg</div>}
                        {cols.changePercent && <div className="text-right w-[55px]">Chg%</div>}
                        {cols.volume && <div className="text-right min-w-[40px]">Vol</div>}
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sortedCategories.map(c => `CAT-${c}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="pb-10">
                            {sortedCategories.map(cat => (
                                <SortableCategory
                                    key={cat}
                                    category={cat}
                                    marketData={marketData}
                                    selectedSymbol={selectedSymbol}
                                    onSelect={onSelect}
                                    onRemoveSymbol={onRemoveSymbol}
                                    onRemoveCategory={onRemoveCategory}
                                    isCollapsed={!!collapsed[cat]}
                                    onToggleCollapse={toggleCollapse}
                                    settings={settings}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default TradingWatchlist;
