import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Star } from 'lucide-react';

const ALL_TIMEFRAMES = [
    { label: '1m', value: '1', desc: '1 Minute' },
    { label: '3m', value: '3', desc: '3 Minutes' },
    { label: '5m', value: '5', desc: '5 Minutes' },
    { label: '15m', value: '15', desc: '15 Minutes' },
    { label: '30m', value: '30', desc: '30 Minutes' },
    { label: '1h', value: '60', desc: '1 Hour' },
    { label: '2h', value: '120', desc: '2 Hours' },
    { label: '4h', value: '240', desc: '4 Hours' },
    { label: 'D', value: 'D', desc: '1 Day' },
    { label: 'W', value: 'W', desc: '1 Week' },
    { label: 'M', value: 'M', desc: '1 Month' },
];

const DEFAULT_FAVORITES = ['1', '5', '15', '60', 'D'];

const TimeframeSelector = ({ timeframe, onTimeframeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('mspk_tf_favorites');
        return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    });

    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleFavorite = (value, e) => {
        e.stopPropagation();
        let newFavs;
        if (favorites.includes(value)) {
            newFavs = favorites.filter(f => f !== value);
        } else {
            newFavs = [...favorites, value];
        }
        setFavorites(newFavs);
        localStorage.setItem('mspk_tf_favorites', JSON.stringify(newFavs));
    };

    const activeTF = ALL_TIMEFRAMES.find(tf => tf.value === timeframe) || ALL_TIMEFRAMES[0];

    return (
        <div className="flex items-center gap-0.5" ref={containerRef}>
            {/* Favorites Bar */}
            <div className="flex items-center gap-0.5 mr-1 hidden md:flex">
                {ALL_TIMEFRAMES.filter(tf => favorites.includes(tf.value)).map(tf => (
                    <button
                        key={tf.value}
                        onClick={() => onTimeframeChange(tf.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded transition whitespace-nowrap min-w-[28px] text-center ${timeframe === tf.value
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>

            {/* Dropdown Trigger */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-1 p-1.5 rounded-md transition hover:bg-accent hover:text-accent-foreground text-muted-foreground ${isOpen ? 'bg-accent/50 text-foreground' : ''}`}
                    title="Select Timeframe"
                >
                    {/* Show label on mobile or if current TF is not in favorites */}
                    <span className="text-[11px] font-bold md:hidden">
                        {activeTF.label}
                    </span>
                    <span className={`text-[11px] font-bold hidden md:block ${favorites.includes(timeframe) ? 'hidden' : ''}`}>
                        {activeTF.label}
                    </span>
                    <ChevronDown size={14} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-md shadow-xl py-1 z-[9999] w-40 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground bg-muted border-b border-border/50 mb-1">
                            Time Intervals
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {ALL_TIMEFRAMES.map((tf) => {
                                const isFav = favorites.includes(tf.value);
                                const isSelected = timeframe === tf.value;
                                return (
                                    <div
                                        key={tf.value}
                                        className={`flex items-center group px-2 py-1.5 hover:bg-accent/50 cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                        onClick={() => {
                                            onTimeframeChange(tf.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <button
                                            onClick={(e) => toggleFavorite(tf.value, e)}
                                            className={`p-1 rounded hover:bg-background mr-2 transition-colors ${isFav ? 'text-400' : 'text-muted-foreground/30 hover:text-yellow-400'
                                                }`}
                                        >
                                            <Star size={12} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-yellow-400" : ""} />
                                        </button>

                                        <span className={`text-[12px] flex-1 ${isSelected ? 'font-bold text-primary' : 'text-foreground'}`}>
                                            {tf.desc}
                                        </span>

                                        <span className={`text-[10px] font-mono ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {tf.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeframeSelector;
