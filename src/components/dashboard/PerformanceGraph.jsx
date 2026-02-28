import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../components/theme-provider';

const PerformanceGraph = ({ data, avgAccuracy, accuracyChange }) => {
    const { theme } = useTheme();
    const chartData = data || [];

    return (
        <div className="h-full flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden relative group hover:border-purple-500/50 transition-all duration-500">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Header */}
            <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                            SIGNAL ACCURACY
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
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Avg. Accuracy</span>
                    <span className="text-3xl font-bold text-foreground tracking-tight flex items-end gap-2">
                        {avgAccuracy ? `${avgAccuracy}%` : '...'}
                        <span className="text-sm font-medium text-purple-500 mb-1.5 flex items-center gap-0.5">
                            {accuracyChange > 0 ? '+' : ''}{accuracyChange}% <ArrowUpRight size={12} />
                        </span>
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-0 pt-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
                            yAxisId="right"
                            orientation='right'
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            hide
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
                        <Bar yAxisId="left" dataKey="volume" barSize={20} fill="#ffffff" fillOpacity={0.05} radius={[4, 4, 0, 0]} name="Volume" />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="accuracy"
                            name="Accuracy %"
                            stroke="#a855f7"
                            strokeWidth={3}
                            dot={{ fill: '#a855f7', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-purple-500 transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
};

export default PerformanceGraph;
