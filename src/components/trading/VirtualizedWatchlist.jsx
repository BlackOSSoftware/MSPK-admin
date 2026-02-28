import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ArrowUp, ArrowDown, X } from 'lucide-react';

const WatchlistItem = memo(({ data, index, style }) => {
    const { symbols, marketData, selectedSymbol, onSelect, onRemove } = data;
    const symbol = symbols[index];
    const quote = marketData[symbol.symbol] || {};
    const isSelected = selectedSymbol?.symbol === symbol.symbol;

    // Formatting
    const price = quote.price ? quote.price.toFixed(2) : '---';
    const change = quote.change ? quote.change.toFixed(2) : '0.00';
    const isUp = parseFloat(change) >= 0;

    return (
        <div
            style={style}
            className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b border-gray-800 hover:bg-gray-800 transition-colors ${isSelected ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''}`}
            onClick={() => onSelect(symbol)}
        >
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-200">{symbol.symbol || symbol.name}</span>
                <span className="text-xs text-gray-500">{symbol.exchange || 'NSE'}</span>
            </div>

            <div className="flex flex-col items-end mr-2">
                <span className={`text-sm font-mono ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {price}
                </span>
                <span className={`text-xs flex items-center ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(change)}%
                </span>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(symbol.symbol); }}
                className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-gray-700"
            >
                <X size={14} />
            </button>
        </div>
    );
}, (prev, next) => {
    // Custom Comparison for Performance
    // Only re-render if:
    // 1. Symbol at this index changed (rare)
    // 2. MarketData for THIS symbol changed (frequent)
    // 3. Selection state changed for THIS symbol

    const prevSym = prev.data.symbols[prev.index];
    const nextSym = next.data.symbols[next.index];
    if (prevSym !== nextSym) return false;

    const prevQuote = prev.data.marketData[prevSym.symbol];
    const nextQuote = next.data.marketData[nextSym.symbol];
    if (prevQuote !== nextQuote) return false;

    const wasSelected = prev.data.selectedSymbol?.symbol === prevSym.symbol;
    const isSelected = next.data.selectedSymbol?.symbol === nextSym.symbol;
    if (wasSelected !== isSelected) return false;

    return true;
});

const VirtualizedWatchlist = ({ symbols, marketData, selectedSymbol, onSelect, onRemove }) => {
    return (
        <div style={{ flex: 1, height: '100%' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        width={width}
                        itemCount={symbols.length}
                        itemSize={60} // Height of each row
                        itemData={{ symbols, marketData, selectedSymbol, onSelect, onRemove }}
                    >
                        {WatchlistItem}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
};

export default memo(VirtualizedWatchlist);
