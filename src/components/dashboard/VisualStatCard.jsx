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

    const isRadial = type === 'radial';

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
            className={`dashboard-surface soft-shadow soft-shadow-hover h-full relative overflow-hidden group transition-all duration-300 bg-card/95 border border-border/70 ring-1 ring-transparent hover:ring-primary/15 ${onClick ? 'cursor-pointer' : ''}`}
            noPadding
            onClick={onClick}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: chartColor }} />
                <div className="absolute -top-10 -right-6 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: toRgba(chartColor, 0.18) }} />
                <div className="absolute bottom-0 left-8 h-16 w-16 rounded-full blur-2xl" style={{ backgroundColor: toRgba(chartColor, 0.1) }} />
            </div>

            <div className={`p-3 sm:p-4 relative z-10 flex flex-col h-full justify-between ${isRadial ? 'pr-12 sm:pr-16' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl border flex items-center justify-center"
                                style={{ backgroundColor: iconBg, borderColor: iconBorder, color: chartColor }}
                            >
                                <StatIcon size={12} className="sm:hidden" />
                                <StatIcon size={14} className="hidden sm:block" />
                            </span>
                            <span
                                className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] px-2 py-0.5 rounded-full border"
                                style={{ color: chartColor, borderColor: toRgba(chartColor, 0.25), backgroundColor: toRgba(chartColor, 0.08) }}
                            >
                                {title}
                            </span>
                        </div>
                        <p className="text-[26px] sm:text-[30px] md:text-[32px] font-semibold text-foreground tracking-tight tabular-nums mt-2">
                            {value}
                        </p>
                    </div>
                    {change && (
                        <div
                            className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-2 py-1 rounded-full border shadow-sm ${
                                isPositive
                                    ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10'
                                    : 'text-rose-600 border-rose-500/20 bg-rose-500/10'
                            }`}
                        >
                            {isPositive ? (
                                <>
                                    <TrendingUp size={10} className="sm:hidden" />
                                    <TrendingUp size={11} className="hidden sm:block" />
                                </>
                            ) : (
                                <>
                                    <TrendingDown size={10} className="sm:hidden" />
                                    <TrendingDown size={11} className="hidden sm:block" />
                                </>
                            )}
                            {change}
                        </div>
                    )}
                </div>

                {subtext && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chartColor }} />
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium uppercase tracking-[0.18em]">
                            {subtext}
                        </p>
                    </div>
                )}
            </div>

            <div
                className={`absolute bottom-0 right-0 z-0 opacity-35 transition-opacity group-hover:opacity-50 pointer-events-none ${
                    isRadial ? 'w-14 h-14 sm:w-16 sm:h-16 right-3 bottom-3' : 'w-full h-16 bottom-0'
                }`}
            >
                {renderChart()}
            </div>
        </Card>
    );
};

export default VisualStatCard;
