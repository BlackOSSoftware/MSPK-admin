import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../components/theme-provider';

const GrowthGraph = ({ data, totalGrowth, growthRate }) => {
    const { theme } = useTheme();

    // Use passed data or fallback to empty array to prevent crashes
    const chartData = data || [];

    return (
        <div className="h-full flex flex-col bg-card border border-border rounded-xl shadow-xl overflow-hidden relative group hover:border-blue-500/50 transition-all duration-500">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"></div>

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Header */}
            <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                            USER ACQUISITION
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Maximize2 size={14} /></button>
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Net Growth</span>
                <span className="text-3xl font-bold text-foreground tracking-tight flex items-end gap-2">
                    {totalGrowth ? `+${totalGrowth}` : '...'}
                    <span className="text-sm font-medium text-blue-500 mb-1.5 flex items-center gap-0.5">
                        {growthRate > 0 ? '+' : ''}{growthRate}% <ArrowUpRight size={12} />
                    </span>
                </span>
            </div>


            {/* Chart Area */}
            <div className="flex-1 w-full min-h-0 pt-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                            dataKey="newUsers"
                            name="New Users"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorNew)"
                        />
                        <Area
                            type="monotone"
                            dataKey="churned"
                            name="Churned"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorChurn)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-700 group-hover:w-full"></div>
        </div >
    );
};

export default GrowthGraph;
