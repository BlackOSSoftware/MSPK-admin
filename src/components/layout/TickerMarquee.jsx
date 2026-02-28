import React from 'react';
import { getSymbols } from '../../api/market.api';
import { Activity } from 'lucide-react';

const TickerMarquee = () => {
    const [indices, setIndices] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // Fetch initial symbols
    React.useEffect(() => {
        const loadSymbols = async () => {
            try {
                // Fetch ONLY watchlist symbols (same as Live Market page)
                const all = await getSymbols({ watchlist: 'true' });

                // Map to view model
                const mapped = all.map(s => {
                    const price = parseFloat(s.lastPrice || 0);
                    const close = parseFloat(s.ohlc?.close || price); // Use Close or fallback to price (0% change)
                    let change = 0;

                    if (close > 0) {
                        change = ((price - close) / close) * 100;
                    }

                    return {
                        symbol: s.symbol,
                        price: price,
                        change: change.toFixed(2),
                        isPositive: change >= 0,
                        prevClose: close, // Store for socket updates
                        segment: s.segment, // Pass segment for precision logic
                        exchange: s.exchange
                    };
                });

                setIndices(mapped);
            } catch (e) {
                console.error("Ticker fetch error", e);
            } finally {
                setLoading(false);
            }
        };
        loadSymbols();
    }, []);

    React.useEffect(() => {
        if (indices.length === 0) return;

        // Dynamic Import to avoid SSR issues if any, though standard import works too
        import('../../api/socket').then(({ socket }) => {
            if (!socket) return;
            const symbols = indices.map(i => i.symbol);

            // Subscribe
            symbols.forEach(sym => socket.emit('subscribe', sym));

            // Listener
            const onTick = (data) => {
                setIndices(prev => prev.map(item => {
                    if (item.symbol === data.symbol) {
                        const newPrice = typeof data.price === 'string' ? parseFloat(data.price) : data.price;

                        // Calculate Daily Change (Price vs PrevClose)
                        let percent = 0;
                        if (item.prevClose && item.prevClose > 0) {
                            percent = ((newPrice - item.prevClose) / item.prevClose) * 100;
                        } else if (data.changePercent !== undefined && data.changePercent !== null) {
                            // Fallback if provider sends explicitly
                            const valStr = String(data.changePercent);
                            percent = parseFloat(valStr.replace('%', ''));
                        }

                        // Determine positivity based on Daily Change (not tick vs tick)
                        const isPositive = percent >= 0;

                        return {
                            ...item,
                            price: newPrice,
                            change: percent.toFixed(2),
                            isPositive: isPositive
                        };
                    }
                    return item;
                }));
            };

            socket.on('tick', onTick);

            // Cleanup
            return () => {
                socket.off('tick', onTick);
                symbols.forEach(sym => socket.emit('unsubscribe', sym));
            };
        });
    }, [indices.length]); // Re-run only if indices list populated (length changes from 0 to N)

    if (loading) return null; // Or a skeleton
    if (indices.length === 0) return null;

    return (
        <div className="flex animate-marquee hover:pause whitespace-nowrap items-center">
            {/* Duplicate list for seamless scroll */}
            {[...indices, ...indices].map((item, i) => {
                const isHighPrecision = ['CURRENCY', 'FOREX', 'CRYPTO', 'BINANCE'].includes(item.segment?.toUpperCase()) || item.exchange === 'FOREX';
                const precision = isHighPrecision ? 5 : 2;

                return (
                    <span key={`${item.symbol}-${i}`} className="flex items-center gap-1.5 mx-4 text-[10px] font-mono font-medium opacity-80 hover:opacity-100 transition-opacity cursor-default">
                        <span className="font-bold text-foreground">{item.symbol}</span>
                        <span className={item.isPositive ? "text-emerald-400" : "text-red-400"}>{item.price?.toFixed(precision)}</span>
                        <span className={item.isPositive ? "text-emerald-500" : "text-red-500"}>{item.isPositive ? '+' : ''}{item.change}%</span>
                    </span>
                )
            })}
        </div>
    );
};

export default TickerMarquee;
