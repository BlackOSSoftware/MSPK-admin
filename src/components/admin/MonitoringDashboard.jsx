import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Activity, Server, Database, Wifi, AlertTriangle } from 'lucide-react';
import api from "../../api/client"; // Make sure this exists, or use axios directly

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MetricCard = ({ title, value, unit, icon: Icon, alert, subtext }) => (
    <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${alert ? 'bg-red-500/10 border-red-500/50' : 'bg-card border-border hover:border-primary/50'}`}>
        <div className="flex justify-between items-start mb-2">
            <div className="text-muted-foreground text-sm font-medium">{title}</div>
            <div className={`p-2 rounded-lg ${alert ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'}`}>
                <Icon size={18} />
            </div>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground font-mono">{value}</span>
            <span className="text-xs text-muted-foreground font-medium">{unit}</span>
        </div>
        {subtext && <div className="text-[10px] text-muted-foreground mt-1">{subtext}</div>}
    </div>
);

const MonitoringDashboard = () => {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState({
        api: [],
        cache: [],
        ws: []
    });

    const fetchMetrics = async () => {
        try {
            // Adjust URL based on your API setup if '/v1/metrics' is served by same origin
            // If strictly separated, use full URL or configured axios instance
            const res = await api.get('/metrics'); // Assuming api instance has base URL
            // If api.get fails because of pure axios, fallback:
            // const res = await fetch('http://localhost:5000/v1/metrics').then(r => r.json());

            const metrics = res.data || res;
            setData(metrics);

            setHistory(prev => {
                const newApi = [...prev.api, metrics.api.requests_per_minute].slice(-20);
                const newCache = [...prev.cache, metrics.derived.cache_hit_rate].slice(-20);
                const newWs = [...prev.ws, metrics.websocket.messages_sent_sec].slice(-20);
                return { api: newApi, cache: newCache, ws: newWs };
            });
        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading System Metrics...</div>;

    // Chart Config
    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: { display: false, min: 0 }
        },
        elements: {
            line: { tension: 0.4 },
            point: { radius: 0 }
        },
        maintainAspectRatio: false
    };

    const createChartData = (label, dataset, color) => ({
        labels: Array(dataset.length).fill(''),
        datasets: [{
            label,
            data: dataset,
            borderColor: color,
            backgroundColor: color + '20', // Hex + Opacity
            borderWidth: 2,
            fill: true
        }]
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">System Monitor</h1>
                    <p className="text-xs text-muted-foreground mt-1">Real-time backend performance metrics</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${data.api.errors_429 > 0 ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-green-500/10 border-green-500/50 text-green-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${data.api.errors_429 > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    {data.api.errors_429 > 0 ? 'CRITICAL ISSUES' : 'SYSTEM OPERATIONAL'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-4">
                    <MetricCard
                        title="API Load"
                        value={data.api.requests_per_minute}
                        unit="req/min"
                        icon={Server}
                        subtext={`Latency: ${data.derived.avg_api_latency}ms`}
                    />
                    <div className="h-16 bg-card rounded-xl border border-border p-2">
                        <Line data={createChartData('API', history.api, '#3b82f6')} options={chartOptions} />
                    </div>
                </div>

                <div className="space-y-4">
                    <MetricCard
                        title="Cache Hit Rate"
                        value={data.derived.cache_hit_rate}
                        unit="%"
                        icon={Database}
                        alert={data.derived.cache_hit_rate < 50}
                        subtext={`H: ${data.cache.hits} / M: ${data.cache.misses}`}
                    />
                    <div className="h-16 bg-card rounded-xl border border-border p-2">
                        <Line data={createChartData('Cache', history.cache, '#10b981')} options={chartOptions} />
                    </div>
                </div>

                <div className="space-y-4">
                    <MetricCard
                        title="WebSocket Active"
                        value={data.websocket.connections}
                        unit="conn"
                        icon={Wifi}
                        subtext={`Queue: ${data.websocket.queue_length}`}
                    />
                    <div className="h-16 bg-card rounded-xl border border-border p-2">
                        <Line data={createChartData('WS', history.ws, '#f59e0b')} options={chartOptions} />
                    </div>
                </div>

                <div className="space-y-4">
                    <MetricCard
                        title="Critical Errors"
                        value={data.api.errors_429}
                        unit="429s"
                        icon={AlertTriangle}
                        alert={data.api.errors_429 > 0}
                        subtext={`Mem: ${data.system.memory_usage_mb} MB`}
                    />
                    <div className="h-16 bg-card rounded-xl border flex items-center justify-center border-border p-2 text-xs text-muted-foreground">
                        {data.api.errors_429 === 0 ? 'No Clean Logs' : 'Check Logs!'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringDashboard;
