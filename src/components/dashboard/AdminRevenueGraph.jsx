import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const AdminRevenueGraph = ({ data, totalRevenue, growth }) => {
    const formatPointLabel = (raw, index) => {
        if (raw === null || raw === undefined || raw === '') return `${index + 1}`;

        const date = new Date(raw);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        }

        return String(raw);
    };

    const [range, setRange] = useState('30D');

    const chartData = Array.isArray(data)
        ? data.map((d, idx) => {
            const rawLabel = d?.date ?? d?.time ?? d?.label ?? d?.x ?? d?.timestamp ?? d?.ts;
            const rawValue = d?.value ?? d?.revenue ?? d?.amount ?? d?.y;
            const parsedDate = rawLabel ? new Date(rawLabel) : null;
            const pointDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

            return {
                time: formatPointLabel(rawLabel, idx),
                revenue: Number(rawValue) || 0,
                pointDate
            };
        })
        : [];

    const filteredData = useMemo(() => {
        if (!chartData.length) return chartData;
        if (range === 'Today') {
            const today = new Date();
            const todays = chartData.filter((d) => d.pointDate && d.pointDate.toDateString() === today.toDateString());
            return todays.length ? todays : chartData;
        }
        const days = range === '7D' ? 7 : range === '90D' ? 90 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const sliced = chartData.filter((d) => !d.pointDate || d.pointDate >= cutoff);
        return sliced.length ? sliced : chartData;
    }, [chartData, range]);

    const formattedTotal = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(totalRevenue || 0);

    const numericGrowth = Number(growth) || 0;
    const isPositive = numericGrowth >= 0;

    const ranges = ['Today', '7D', '30D', '90D'];

    return (
        <Card className="dashboard-surface soft-shadow soft-shadow-hover h-full relative overflow-hidden" noPadding showAccents={false}>
            <div className="h-full flex flex-col relative">
                {/* Header */}
                <div className="relative z-10 px-4 py-3 border-b border-border/70 bg-secondary/40 flex items-start justify-between gap-4 shrink-0">
                    <div className="min-w-0">
                        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.22em] uppercase">
                            Revenue Analytics
                        </p>
                        <p className="mt-0.5 text-xl md:text-2xl font-semibold tracking-tight tabular-nums text-foreground truncate">
                            {formattedTotal}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge
                            variant={isPositive ? 'success' : 'danger'}
                            className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border border-border/60 bg-card/80"
                        >
                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span className="ml-1">
                                {isPositive ? '+' : ''}{numericGrowth}%
                            </span>
                        </Badge>

                        <div className="flex items-center rounded-full bg-background/60 border border-border/60 p-1">
                            {ranges.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setRange(item)}
                                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition ${
                                        range === item
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="relative z-10 flex-1 min-h-0 p-4">
                    {filteredData.length === 0 ? (
                        <div className="h-full grid place-items-center text-muted-foreground text-xs font-medium">
                            No revenue data
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredData} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'inherit' }}
                                    dy={8}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'inherit' }}
                                    tickFormatter={(v) => {
                                        const n = Number(v) || 0;
                                        if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
                                        if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
                                        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
                                        return `${n}`;
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    formatter={(value) => [
                                        new Intl.NumberFormat('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        }).format(Number(value) || 0),
                                        'Revenue'
                                    ]}
                                    itemStyle={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--foreground))' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', marginBottom: '4px' }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    name="Revenue"
                                    fill="hsl(var(--primary))"
                                    opacity={0.6}
                                    radius={[6, 6, 2, 2]}
                                    maxBarSize={36}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default AdminRevenueGraph;
