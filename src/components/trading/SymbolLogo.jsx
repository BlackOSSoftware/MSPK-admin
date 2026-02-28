import React, { useState } from 'react';

const SymbolLogo = ({ symbol, size = 24, className = "" }) => {
    const [error, setError] = useState(false);

    // 1. Crypto Handling (e.g., BTCUSD, ETHUSD)
    // We try to extract the base coin (BTC, ETH, XRP)
    // Common coins mapping to CoinCap IDs mostly works by symbol lowercased, 
    // but for stability we can use a generic approach or manual map for top coins.
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('XRP') || symbol.includes('SOL') || symbol.includes('DOGE');

    // 2. Forex Handling (e.g., EURUSD, GBPJPY)
    // We check if it's a 6-letter currency pair
    const isForex = !isCrypto && /^[A-Z]{6}$/.test(symbol) && (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('JPY') || symbol.includes('GBP'));

    if (error) {
        // Fallback: Initials with random-ish color
        const colorIndex = symbol.length % 5;
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
        const bg = colors[colorIndex];

        return (
            <div className={`${bg} text-white rounded-full flex items-center justify-center font-bold text-[10px] select-none ${className}`} style={{ width: size, height: size }}>
                {symbol.substring(0, 1)}
            </div>
        );
    }

    if (isCrypto) {
        // Extract base. BTCUSD -> btc
        const base = symbol.replace('USD', '').replace('USDT', '').toLowerCase();
        const iconUrl = `https://assets.coincap.io/assets/icons/${base}@2x.png`;

        return (
            <img
                src={iconUrl}
                alt={symbol}
                onError={() => setError(true)}
                className={`rounded-full ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }

    if (isForex) {
        // Dual Flag Logic
        // EURUSD -> EUR + USD
        const base = symbol.substring(0, 3).toLowerCase(); // eur
        const quote = symbol.substring(3, 6).toLowerCase(); // usd

        // Map common codes to country codes for flagcdn
        // eur -> eu, usd -> us, gbp -> gb, jpy -> jp, aud -> au, cad -> ca, chf -> ch, nzd -> nz
        const countryMap = {
            'eur': 'eu', 'usd': 'us', 'gbp': 'gb', 'jpy': 'jp',
            'aud': 'au', 'cad': 'ca', 'chf': 'ch', 'nzd': 'nz'
        };

        const c1 = countryMap[base];
        const c2 = countryMap[quote];

        if (c1 && c2) {
            return (
                <div className={`relative flex items-center ${className}`} style={{ width: size, height: size }}>
                    <img
                        src={`https://flagcdn.com/w40/${c1}.png`}
                        className="absolute left-0 rounded-full border border-background shadow-sm z-10"
                        style={{ width: size * 0.7, height: size * 0.7, objectFit: 'cover' }}
                    />
                    <img
                        src={`https://flagcdn.com/w40/${c2}.png`}
                        className="absolute right-0 bottom-0 rounded-full border border-background shadow-sm"
                        style={{ width: size * 0.7, height: size * 0.7, objectFit: 'cover' }}
                    />
                </div>
            );
        }
    }

    // Default Fallback (will trigger onError immediately to show initials if we tried an image, 
    // but here we just go straight to initials for non-crypto/non-forex)
    const colorIndex = symbol.length % 5;
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
    const bg = colors[colorIndex];

    return (
        <div className={`${bg} text-white rounded-full flex items-center justify-center font-bold text-[10px] select-none ${className}`} style={{ width: size, height: size }}>
            {symbol.substring(0, 1)}
        </div>
    );
};

export default SymbolLogo;
