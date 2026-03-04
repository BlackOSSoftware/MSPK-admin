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
    const displayValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value;

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
                {
                    const radialData = [{ name: 'L1', value: 100, fill: isDark ? '#1e293b' : '#e2e8f0' }, { name: 'L2', value: 75, fill: chartColor }];
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={6} data={radialData} startAngle={90} endAngle={-270}>
                                <RadialBar background clockWise dataKey="value" cornerRadius={5} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    );
                }
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
            className={`metallic-surface soft-shadow soft-shadow-hover rounded-2xl h-full min-h-[144px] md:min-h-[164px] relative overflow-hidden group transition-all duration-300 border border-border/70 ring-1 ring-transparent hover:ring-primary/20 ${onClick ? 'cursor-pointer' : ''}`}
            noPadding
            onClick={onClick}
        >
            <div className="p-6 md:p-7 relative z-10 flex flex-col h-full items-center justify-center text-center gap-2">
                <span
                    className="h-11 w-11 rounded-2xl border flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: iconBg, borderColor: iconBorder, color: chartColor }}
                >
                    <StatIcon size={18} />
                </span>

                <h3 className="text-muted-foreground text-[11px] font-semibold tracking-[0.24em] uppercase">
                    {title}
                </h3>

                <p className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-none tabular-nums">
                    {displayValue}
                </p>

                {change && (
                    <div
                        className={`inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${
                            isPositive
                                ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10'
                                : 'text-rose-600 border-rose-500/20 bg-rose-500/10'
                        }`}
                    >
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {change}
                    </div>
                )}

                {subtext && (
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.18em]">
                        {subtext}
                    </p>
                )}
            </div>

            <div
                className={`pointer-events-none absolute bottom-0 right-0 z-0 opacity-30 transition-opacity group-hover:opacity-45 ${
                    isRadial ? 'w-[76px] h-[76px] right-2 bottom-2' : 'w-full h-20 bottom-0'
                }`}
            >
                {renderChart()}
            </div>
        </Card>
    );
};

export default VisualStatCard;
