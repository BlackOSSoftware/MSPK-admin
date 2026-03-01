import React from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

const TickerItem = ({ symbol, price, change, isPositive }) => (
    <div className="flex items-center gap-3 px-6 border-r border-border/60 min-w-max">
        <span className="font-bold text-muted-foreground font-mono tracking-tight">{symbol}</span>
        <span className="font-mono text-foreground">{price}</span>
        <span className={`text-xs flex items-center gap-1 font-medium ${isPositive ? 'text-up' : 'text-down'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}%
        </span>
    </div>
);

const MarketTicker = () => {
    // Mock data for ticker
    const items = [
        { symbol: "NIFTY", price: "21,456.00", change: 0.45, isPositive: true },
        { symbol: "BANKNIFTY", price: "47,890.00", change: -0.12, isPositive: false },
        { symbol: "CRUDEOIL", price: "6,230.00", change: 1.25, isPositive: true },
        { symbol: "GOLD", price: "62,500.00", change: 0.05, isPositive: true },
        { symbol: "BTC/USD", price: "43,120.00", change: -2.40, isPositive: false },
        { symbol: "USD/INR", price: "83.15", change: 0.01, isPositive: true },
    ];

    return (
        <div className="h-9 bg-card/60 border-b border-border/70 flex items-center overflow-hidden relative backdrop-blur-md">
            <div className="flex items-center px-4 bg-secondary/60 h-full border-r border-border/60 text-primary gap-2 shrink-0 z-10">
                <Clock size={12} />
                <span className="text-[10px] font-bold tracking-wider uppercase hidden md:inline">Market Feed</span>
            </div>

            <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap hover:pause">
                {[...items, ...items, ...items].map((item, i) => (
                    <TickerItem key={i} {...item} />
                ))}
            </div>

            {/* Gradients */}
            <div className="absolute left-[100px] top-0 bottom-0 w-12 bg-gradient-to-r from-background/90 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background/90 to-transparent z-10 pointer-events-none"></div>
        </div>
    );
};

export default MarketTicker;
