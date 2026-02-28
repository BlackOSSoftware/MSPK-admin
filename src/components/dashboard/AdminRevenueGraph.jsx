import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, MoreHorizontal, Calendar, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../components/theme-provider';

const AdminRevenueGraph = ({ data, totalRevenue, growth }) => {
    const { theme } = useTheme();

    // Format Data for Chart if needed (or rely on API keys)
    // API sends: { date: '2024-12-01', value: 1000 }
    // Chart expects: time, revenue

    // Data comes pre-formatted from backend or needs simple mapping
    // Backend sends: [{ date: '2024-12-01', value: 1000 }]

    const chartData = data ? data.map(d => ({
        time: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: d.value
    })) : [];

    return (
        <div className="h-full flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden relative group hover:border-primary/50 transition-all duration-500">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Header */}
            <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-accent/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                            REVENUE GROWTH
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Maximize2 size={14} /></button>
                </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-16 left-6 z-10 pointer-events-none">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Total Revenue</span>
                    <span className="text-3xl font-bold text-foreground tracking-tight flex items-end gap-2">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalRevenue || 0)}
                        <span className="text-sm font-medium text-emerald-500 mb-1.5 flex items-center gap-0.5">
                            {growth > 0 ? '+' : ''}{growth}% <ArrowUpRight size={12} />
                        </span>
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-0 pt-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: 'hsl(var(--foreground))'
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
};

export default AdminRevenueGraph;
