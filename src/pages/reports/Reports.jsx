import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { BarChart2, TrendingUp, Users, Download, Calendar, DollarSign, Activity } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AdminRevenueGraph from '../../components/dashboard/AdminRevenueGraph';
import GrowthGraph from '../../components/dashboard/GrowthGraph';
import PerformanceGraph from '../../components/dashboard/PerformanceGraph';
import { getAnalyticsData, exportAnalyticsData } from '../../api/analytics.api';
import useToast from '../../hooks/useToast';

const StatCard = ({ title, value, change, positive }) => (
    <Card className="bg-card border-border p-4 relative overflow-hidden group hover:border-primary/50 transition-all">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={40} />
        </div>
        <div className="space-y-1 relative z-10">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</h4>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{value}</span>
                <span className={clsx("text-[10px] font-bold", positive ? "text-emerald-500" : "text-red-500")}>
                    {change > 0 ? "+" : ""}{change}%
                </span>
            </div>
        </div>
    </Card>
);

import { Skeleton } from '../../components/ui/Skeleton';

const ReportsSkeleton = () => (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border p-4 relative overflow-hidden h-[100px]">
                    <div className="space-y-4 relative z-10">
                        <Skeleton className="h-3 w-24" />
                        <div className="flex items-baseline gap-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
        <div className="h-[450px] w-full bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
            <div className="flex items-end gap-2 h-[350px] pb-4 px-4">
                {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
            </div>
        </div>
    </div>
);

const Reports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [range, setRange] = useState('month'); // 'month', 'quarter', 'year'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleExport = async () => {
        try {
            const response = await exportAnalyticsData(activeTab, range);
            // Create Blob from response
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${activeTab}-${range}-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Export Failed", error);
            // toast.error("Failed to export CSV");
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [activeTab, range]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setData(null); // Clear data to show skeleton on tab switch
        try {
            const { data: response } = await getAnalyticsData(activeTab, range);
            // Simulate slight delay for better UX if response is too fast
            await new Promise(resolve => setTimeout(resolve, 500));
            setData(response);
        } catch (error) {
            console.error("Analytics Error", error);
            // toast.error("Failed to load analytics"); // Suppress initial error
        } finally {
            setLoading(false);
        }
    };

    // Format Helpers
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border">
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'revenue'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <DollarSign size={14} /> Revenue
                    </button>
                    <button
                        onClick={() => setActiveTab('subscription')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'subscription'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Users size={14} /> Subscriptions
                    </button>
                    <button
                        onClick={() => setActiveTab('signals')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'signals'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <TrendingUp size={14} /> Signal Performance
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">

                {/* Toolbar */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-card border border-border rounded-lg p-1 flex items-center">
                            <button
                                onClick={() => setRange('month')}
                                className={clsx("px-3 py-1 text-[10px] font-bold rounded transition-colors", range === 'month' ? "text-foreground bg-primary/20" : "text-muted-foreground hover:text-foreground")}
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => setRange('quarter')}
                                className={clsx("px-3 py-1 text-[10px] font-bold rounded transition-colors", range === 'quarter' ? "text-foreground bg-primary/20" : "text-muted-foreground hover:text-foreground")}
                            >
                                Last Quarter
                            </button>
                            <button
                                onClick={() => setRange('year')}
                                className={clsx("px-3 py-1 text-[10px] font-bold rounded transition-colors", range === 'year' ? "text-foreground bg-primary/20" : "text-muted-foreground hover:text-foreground")}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 border-border shadow-sm" onClick={handleExport}>
                        <Download size={14} /> Export CSV
                    </Button>
                </div>

                {loading || !data ? (
                    <ReportsSkeleton />
                ) : (
                    <div className="max-w-6xl mx-auto space-y-6 pb-10">

                        {activeTab === 'revenue' && data?.cards?.totalRevenue && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <StatCard title="Total Revenue" value={formatCurrency(data.cards.totalRevenue?.value ?? 0)} change={data.cards.totalRevenue?.change ?? 0} positive={data.cards.totalRevenue?.change > 0} />
                                    <StatCard title="Avg. Revenue / User" value={formatCurrency(data.cards.avgRevenue?.value ?? 0)} change={data.cards.avgRevenue?.change ?? 0} positive={data.cards.avgRevenue?.change > 0} />
                                    <StatCard title="Refunds Processed" value={formatCurrency(data.cards.refunds?.value ?? 0)} change={data.cards.refunds?.change ?? 0} positive={data.cards.refunds?.change > 0} />
                                    <StatCard title="Projected" value={formatCurrency(data.cards.projected?.value ?? 0)} change={data.cards.projected?.change ?? 0} positive={data.cards.projected?.change > 0} />
                                </div>

                                <div className="h-[400px] w-full">
                                    <AdminRevenueGraph
                                        data={data.graph}
                                        totalRevenue={data.cards.totalRevenue?.value ?? 0}
                                        growth={data.cards.totalRevenue?.change ?? 0}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'subscription' && data?.cards?.newSubscribers && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <StatCard title="New Subscribers" value={data.cards.newSubscribers?.value ?? 0} change={data.cards.newSubscribers?.change ?? 0} positive={data.cards.newSubscribers?.change > 0} />
                                    <StatCard title="Churn Rate" value={`${data.cards.churnRate?.value ?? 0}%`} change={data.cards.churnRate?.change ?? 0} positive={data.cards.churnRate?.change < 0} />
                                    <StatCard title="Active Plans" value={data.cards.activePlans?.value ?? 0} change={data.cards.activePlans?.change ?? 0} positive={data.cards.activePlans?.change > 0} />
                                    <StatCard title="Retention" value={`${data.cards.retention?.value ?? 0}%`} change={data.cards.retention?.change ?? 0} positive={data.cards.retention?.change > 0} />
                                </div>

                                <div className="h-[400px] w-full">
                                    <GrowthGraph
                                        data={data.graph}
                                        totalGrowth={data.cards.newSubscribers?.value}
                                        growthRate={data.cards.newSubscribers?.change}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'signals' && data?.cards?.winRate && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <StatCard title="Win Rate" value={`${data.cards.winRate?.value ?? 0}%`} change={data.cards.winRate?.change ?? 0} positive={data.cards.winRate?.change > 0} />
                                    <StatCard title="Total Signals" value={data.cards.totalSignals?.value ?? 0} change={data.cards.totalSignals?.change ?? 0} positive={data.cards.totalSignals?.change > 0} />
                                    <StatCard title="Avg. Profit" value={`${data.cards.avgProfit?.value ?? 0}%`} change={data.cards.avgProfit?.change ?? 0} positive={data.cards.avgProfit?.change > 0} />
                                    <StatCard title="Loss Streak" value={window.innerWidth < 1000 ? "3" : (data.cards.lossStreak?.value ?? 0)} change={data.cards.lossStreak?.change ?? 0} positive={data.cards.lossStreak?.change < 0} />
                                </div>

                                <div className="h-[400px] w-full">
                                    <PerformanceGraph
                                        data={data.graph}
                                        avgAccuracy={data.cards.winRate?.value}
                                        accuracyChange={data.cards.winRate?.change}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
