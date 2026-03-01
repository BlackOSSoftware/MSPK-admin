import React from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useTheme } from '../theme-provider';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const toRgba = (hex, alpha) => {
    if (typeof hex !== 'string') return `rgba(99, 102, 241, ${alpha})`;
    let value = hex.replace('#', '').trim();
    if (value.length === 3) {
        value = value.split('').map((c) => c + c).join('');
    }
    if (value.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const VisualStatCard = ({ title, value, change, type = 'area', data, color = '#f59e0b', subtext, onClick, icon: Icon }) => {
    const { resolvedMode } = useTheme();
    const isDark = resolvedMode === 'dark';

    // Theme color adjustment
    const chartColor = color;
    const StatIcon = Icon || Activity;
    const iconBg = toRgba(chartColor, 0.12);
    const iconBorder = toRgba(chartColor, 0.24);

    const renderChart = () => {
        // Data normalization
        const chartData = data || [
            { value: 10 }, { value: 20 }, { value: 35 }, { value: 25 }, { value: 40 }, { value: 15 }, { value: 30 }, { value: 20 }, { value: 45 }
        ];

        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Bar dataKey="value" fill={chartColor} radius={[1, 1, 0, 0]} opacity={0.6} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'radial':
                const radialData = [{ name: 'L1', value: 100, fill: isDark ? '#1e293b' : '#e2e8f0' }, { name: 'L2', value: 75, fill: chartColor }];
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={6} data={radialData} startAngle={90} endAngle={-270}>
                            <RadialBar background clockWise dataKey="value" cornerRadius={5} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                );
            case 'area':
            default:
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill={`url(#grad-${title})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
        }
    };

    const isPositive = change && !change.startsWith('-');

    return (
        <Card
            showAccents={false}
            className={`dashboard-surface soft-shadow soft-shadow-hover h-full relative overflow-hidden group transition-all duration-300 bg-card/90 border border-border/70 ring-1 ring-transparent hover:ring-primary/15 ${onClick ? 'cursor-pointer' : ''}`}
            noPadding
            onClick={onClick}
        >
            <div className="p-4 relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="h-7 w-7 rounded-lg border flex items-center justify-center"
                                style={{ backgroundColor: iconBg, borderColor: iconBorder, color: chartColor }}
                            >
                                <StatIcon size={13} />
                            </span>
                            <h3 className="text-muted-foreground text-[10px] font-semibold tracking-[0.2em] uppercase">
                                {title}
                            </h3>
                        </div>
                        <p className="text-2xl md:text-[26px] font-semibold text-foreground tracking-tight tabular-nums">
                            {value}
                        </p>
                    </div>
                    {change && (
                        <div
                            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
                                isPositive
                                    ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10'
                                    : 'text-rose-600 border-rose-500/20 bg-rose-500/10'
                            }`}
                        >
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {change}
                        </div>
                    )}
                </div>

                {subtext && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.18em]">
                            {subtext}
                        </p>
                    </div>
                )}
            </div>

            <div className={`absolute bottom-0 right-0 z-0 opacity-35 transition-opacity group-hover:opacity-50 ${type === 'radial' ? 'w-16 h-16 right-1 bottom-1' : 'w-full h-16 bottom-0'}`}>
                {renderChart()}
            </div>
        </Card>
    );
};

export default VisualStatCard;
