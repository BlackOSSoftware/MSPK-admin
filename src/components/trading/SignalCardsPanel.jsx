import React from 'react';

const SignalCard = ({ timeframe, signal }) => {
    // Styling based on Signal Type
    const isBuy = signal.type === 'BUY';
    const isSell = signal.type === 'SELL';

    let bgColor = 'bg-muted/20';
    let borderColor = 'border-border';

    if (isBuy) {
        bgColor = 'bg-[#10b981]';
        borderColor = 'border-[#059669]';
    } else if (isSell) {
        bgColor = 'bg-[#ef4444]';
        borderColor = 'border-[#dc2626]';
    }

    // Format Time Info
    const timeAgo = signal.timeAgo || '---';

    return (
        <div className={`flex flex-col p-2 rounded-md ${bgColor} text-white border ${borderColor} shadow-sm min-w-[180px] flex-1`}>
            {/* Header */}
            <div className="text-xs font-bold mb-1 opacity-90 border-b border-white/20 pb-1">
                Pro Signals - {timeframe}
            </div>

            {/* Main Signal Status */}
            <div className="text-[11px] font-medium leading-tight mb-2">
                {signal.type} came {timeAgo}
            </div>

            {/* Price Details */}
            <div className="flex flex-col gap-0.5 text-[10px] font-mono leading-tight opacity-95">
                <div className="font-bold">{signal.type} @ : {signal.entry}</div>
                <div>Target:1 : {signal.t1}</div>
                <div>Target:2 : {signal.t2}</div>
                <div>Target:3 : {signal.t3}</div>
                <div className="mt-1 font-bold">Trailing SL : {signal.sl}</div>
                <div className="font-bold">Current P/L : {signal.pnl}</div>
            </div>
        </div>
    );
};

import { getHistory } from '../../api/market.api';
import { fetchSignals as fetchBackendSignals } from '../../api/signals.api';
import { formatPrice } from '../../utils/chartUtils';
import { useState, useEffect } from 'react';

const SignalCardsPanel = ({ symbol }) => {
    const [signals, setSignals] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;

        const fetchSignals = async () => {
            setLoading(true);
            const timeframes = ['5', '15', '60'];
            const newSignals = {};

            try {
                // Fetch signals from backend for all TFs in parallel
                await Promise.all(timeframes.map(async (tf) => {
                    const ResolutionMap = { '5': '5m', '15': '15m', '60': '1h' };
                    const backendTF = ResolutionMap[tf];

                    const response = await fetchBackendSignals({
                        symbol: symbol.symbol,
                        timeframe: backendTF,
                        limit: 1, // Only need the latest one for each TF
                    });

                    const signalsData = response.data?.results || response.results || [];

                    if (signalsData.length > 0) {
                        const lastSignal = signalsData[0];
                        const entry = lastSignal.entry || lastSignal.entryPrice;
                        const isBuy = lastSignal.type === 'BUY';

                        // Calculate Time Ago
                        const signalTime = new Date(lastSignal.createdAt).getTime();
                        const diffMs = Date.now() - signalTime;
                        const diffMins = Math.floor(diffMs / 60000);
                        const timeAgoStr = diffMins < 60 ? `${diffMins} mins ago` : `${Math.floor(diffMins / 60)}h ago`;

                        // Targets and SL from backend
                        const t1 = lastSignal.targets?.target1 || 0;
                        const t2 = lastSignal.targets?.target2 || 0;
                        const t3 = lastSignal.targets?.target3 || 0;
                        const sl = lastSignal.stoploss || lastSignal.stopLoss || 0;

                        // P/L Calculation (approximate using current symbol price)
                        const currentPrice = symbol.price || entry; // fallback to entry if price missing
                        const pnl = isBuy ? (currentPrice - entry) : (entry - currentPrice);

                        newSignals[tf === '60' ? 'Hourly' : `${tf}min`] = {
                            type: lastSignal.type,
                            timeAgo: timeAgoStr,
                            entry: formatPrice(entry, symbol.symbol),
                            t1: formatPrice(t1, symbol.symbol),
                            t2: formatPrice(t2, symbol.symbol),
                            t3: formatPrice(t3, symbol.symbol),
                            sl: formatPrice(sl, symbol.symbol),
                            pnl: formatPrice(pnl, symbol.symbol)
                        };
                    } else {
                        // No Signal Found
                        newSignals[tf === '60' ? 'Hourly' : `${tf}min`] = { type: 'NEUTRAL', timeAgo: '---' };
                    }
                }));
                setSignals(newSignals);
            } catch (err) {
                console.error("Failed to fetch backend signals", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSignals();
        // Poll every 1 minute
        const interval = setInterval(fetchSignals, 60000);
        return () => clearInterval(interval);

    }, [symbol?.symbol]);

    return (
        <div className="flex flex-col h-full bg-background border-t border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/50">
                <span className="text-xs font-bold text-foreground">Active Signals</span>
                <span className="text-[10px] text-muted-foreground">{symbol?.symbol || '---'}</span>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="text-xs text-center p-4">Calculating...</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {/* Only render if we have data, else render placeholders or empty */}
                        <SignalCard timeframe="5min" signal={signals['5min'] || { type: 'WAITING' }} />
                        <SignalCard timeframe="15min" signal={signals['15min'] || { type: 'WAITING' }} />
                        <SignalCard timeframe="Hourly" signal={signals['Hourly'] || { type: 'WAITING' }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalCardsPanel;
