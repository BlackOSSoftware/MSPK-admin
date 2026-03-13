import React from 'react';
import { Users, CreditCard, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VisualStatCard from '../../components/dashboard/VisualStatCard';
import AdminRevenueGraph from '../../components/dashboard/AdminRevenueGraph';
import RecentOrdersTable from '../../components/dashboard/RecentOrdersTable';
import ActivityLog from '../../components/dashboard/ActivityLog';
import QuickActions from '../../components/dashboard/QuickActions';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { fetchDashboardStats } from '../../api/dashboard.api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [stats, setStats] = React.useState({
        users: { total: 0, growth: 0 },
        subscriptions: { active: 0, growth: 0 },
        revenue: { total: 0, growth: 0 },
        tickets: { pending: 0 },
        revenueGraph: [],
        recentOrders: [],
        activityLog: []
    });

    React.useEffect(() => {
        const loadStats = async () => {
            try {
                // setLoading(true); // Already true initially
                const { data } = await fetchDashboardStats();
                setStats(data);
            } catch (e) {
                console.error("Stats load failed", e);
                setError("Failed to load dashboard statistics.");
            } finally {
                // Min loading time
                setTimeout(() => setLoading(false), 800);
            }
        };
        loadStats();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-4 sm:space-y-5 flex flex-col h-auto lg:h-full lg:overflow-hidden pb-3 sm:pb-4 lg:pb-0">
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm text-center">
                    {error} <button onClick={() => window.location.reload()} className="underline font-bold ml-2">Retry</button>
                </div>
            )}

            {/* ... */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 h-auto shrink-0">
                <VisualStatCard
                    title="Total Users"
                    value={stats.users?.total || 0}
                    change={`${stats.users?.growth || 0}%`}
                    type="bar"
                    color="#0ea5e9"
                    icon={Users}
                    onClick={() => navigate('/users/all')}
                />
                <VisualStatCard
                    title="Active Subscriptions"
                    value={stats.subscriptions?.active || 0}
                    change={`${stats.subscriptions?.growth || 0}%`}
                    type="radial"
                    color="#2563eb"
                    icon={CreditCard}
                    onClick={() => navigate('/subscriptions/active')}
                />
                <VisualStatCard
                    title="Pending Tickets"
                    value={stats.tickets?.pending || 0}
                    type="area"
                    color="#f97316"
                    icon={MessageSquare}
                    onClick={() => navigate('/tickets/all')}
                />
            </div>

            {/* Main Content Grid - Trading Layout with Admin Data */}
            {/* Layout Grid */}
            <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:pb-2">
                {/* Left Column: Graph & Orders (8/12) */}
                <div className="lg:col-span-9 flex flex-col gap-3 h-auto lg:h-full lg:min-h-0">
                    {/* Revenue Graph */}
                    <div className="h-64 sm:h-72 lg:h-auto lg:flex-1 lg:min-h-0">
                        <AdminRevenueGraph data={stats.revenueGraph} totalRevenue={stats.revenue?.total} growth={stats.revenue?.growth} />
                    </div>
                    {/* Recent Orders*/}
                    <div className="hidden md:block h-56 lg:h-56 shrink-0">
                        <RecentOrdersTable orders={stats.recentOrders} />
                    </div>
                </div>

                {/* Right Column: Activity & Quick Actions (4/12) */}
                <div className="lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full lg:min-h-0">
                    {/* Activity Log */}
                    <div className="h-64 sm:h-80 lg:h-auto lg:flex-1 lg:min-h-0 rounded-2xl overflow-hidden">
                        <ActivityLog logs={stats.activityLog} />
                    </div>
                    {/* Quick Actions*/}
                    <div className="h-auto lg:h-48 shrink-0">
                        <QuickActions />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
