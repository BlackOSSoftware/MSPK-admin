import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLayout from '../components/layout/AdminLayout';
import Login from '../pages/auth/Login';
import KiteLoginCallback from '../pages/auth/KiteLoginCallback';
import Dashboard from '../pages/dashboard/AdminDashboard';

// User Management
import AllUsers from '../pages/users/AllUsers';
import CreateUser from '../pages/users/CreateUser';
import UserDetails from '../pages/users/UserDetails';
import EditUser from '../pages/users/EditUser';
import SubscriptionHistory from '../pages/users/SubscriptionHistory';
import SignalsAccess from '../pages/users/SignalsAccess';

// Plan Management
import AllPlans from '../pages/plans/AllPlans';
import CreatePlan from '../pages/plans/CreatePlan';
import EditPlan from '../pages/plans/EditPlan';
import PlanValiditySettings from '../pages/plans/PlanValiditySettings';
import DemoPlanSettings from '../pages/plans/DemoPlanSettings';
import PurchaseHistory from '../pages/plans/PurchaseHistory';

// Subscription Management
import AllPurchases from '../pages/subscriptions/AllPurchases';
import ActiveSubscriptions from '../pages/subscriptions/ActiveSubscriptions';
import ExpiredSubscriptions from '../pages/subscriptions/ExpiredSubscriptions';
import ExtendSubscription from '../pages/subscriptions/ExtendSubscription';
import AssignPlan from '../pages/subscriptions/AssignPlan';

// Strategy Management
import AllStrategies from '../pages/strategies/AllStrategies';
import CreateStrategy from '../pages/strategies/CreateStrategy';

// Signal Management
import AllSignals from '../pages/signals/AllSignals';
import CreateSignal from '../pages/signals/CreateSignal';
import EditSignal from '../pages/signals/EditSignal';
import SignalCategories from '../pages/signals/SignalCategories';
import SignalHistory from '../pages/signals/SignalHistory';
import GlobalAccess from '../pages/signals/GlobalAccess';

// Market Data
import ManageSymbols from '../pages/market/ManageSymbols';
import AddSymbol from '../pages/market/AddSymbol';
import EditSymbol from '../pages/market/EditSymbol';

// Support
import AllTickets from '../pages/tickets/AllTickets';
import CreateTicket from '../pages/tickets/CreateTicket';
import TicketDetails from '../pages/tickets/TicketDetails';
import { ReplyTicket } from '../pages/tickets/TicketPages'; // Keep others if needed

// Settings
// Settings
import Settings from '../pages/settings/Settings';
import NotificationTemplates from '../pages/settings/NotificationTemplates';


// Announcements
import AllAnnouncements from '../pages/announcements/AllAnnouncements';
import CreateAnnouncement from '../pages/announcements/CreateAnnouncement';
import Calendar from '../pages/announcements/Calendar';

import MarketData from '../pages/market/MarketData';


// Broker Management
import AllBrokers from '../pages/brokers/AllBrokers';
import AddBroker from '../pages/brokers/AddBroker';
import BrokerDetails from '../pages/brokers/BrokerDetails';
import EditBroker from '../pages/brokers/EditBroker';

import NotificationDetails from '../pages/notifications/NotificationDetails';
import MonitoringDashboard from '../components/admin/MonitoringDashboard';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />

                    {/* Dashboard */}
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* User Management */}
                    <Route path="users/all" element={<AllUsers />} />
                    <Route path="users/create" element={<CreateUser />} />
                    <Route path="users/details" element={<UserDetails />} />
                    <Route path="users/edit" element={<EditUser />} />
                    <Route path="users/history" element={<SubscriptionHistory />} />
                    <Route path="users/access" element={<SignalsAccess />} />

                    {/* Plan Management */}
                    <Route path="plans/all" element={<AllPlans />} />
                    <Route path="plans/create" element={<CreatePlan />} />
                    <Route path="plans/edit" element={<EditPlan />} />
                    <Route path="plans/validity" element={<PlanValiditySettings />} />
                    <Route path="plans/demo" element={<DemoPlanSettings />} />
                    <Route path="plans/purchases" element={<PurchaseHistory />} />

                    {/* Subscription Management */}
                    <Route path="subscriptions/all" element={<AllPurchases />} />
                    <Route path="subscriptions/active" element={<ActiveSubscriptions />} />
                    <Route path="subscriptions/expired" element={<ExpiredSubscriptions />} />
                    <Route path="subscriptions/extend" element={<ExtendSubscription />} />
                    <Route path="subscriptions/assign" element={<AssignPlan />} />

                    {/* Strategy Management */}
                    <Route path="strategies/all" element={<AllStrategies />} />
                    <Route path="strategies/create" element={<CreateStrategy />} />

                    {/* Signal Management */}
                    <Route path="signals/all" element={<AllSignals />} />
                    <Route path="signals/create" element={<CreateSignal />} />
                    <Route path="signals/edit" element={<EditSignal />} />
                    <Route path="signals/categories" element={<SignalCategories />} />
                    <Route path="signals/history" element={<SignalHistory />} />
                    <Route path="signals/access" element={<GlobalAccess />} />

                    {/* Market Data */}
                    {/* Market Data */}
                    <Route path="market/symbols" element={<ManageSymbols />} />
                    <Route path="market/add" element={<AddSymbol />} />
                    <Route path="market/edit" element={<EditSymbol />} />
                    <Route path="market/data" element={<MarketData />} />
                    <Route path="market/login/kite" element={<KiteLoginCallback />} />


                    {/* Support / Tickets */}
                    <Route path="tickets/all" element={<AllTickets />} />
                    {/* <Route path="tickets/create" element={<CreateTicket />} /> */}
                    <Route path="tickets/details" element={<TicketDetails />} />
                    <Route path="tickets/reply" element={<ReplyTicket />} />

                    {/* Settings */}
                    <Route path="settings/all" element={<Settings />} />
                    <Route path="settings/notifications" element={<NotificationTemplates />} />

                    {/* Announcements */}
                    <Route path="announcements/all" element={<AllAnnouncements />} />
                    <Route path="announcements/create" element={<CreateAnnouncement />} />
                    <Route path="announcements/edit/:id" element={<CreateAnnouncement />} />
                    <Route path="announcements/calendar" element={<Calendar />} />


                    {/* Sub Brokers */}
                    <Route path="brokers/all" element={<AllBrokers />} />
                    <Route path="brokers/add" element={<AddBroker />} />
                    <Route path="brokers/details" element={<BrokerDetails />} />
                    <Route path="brokers/edit" element={<EditBroker />} />


                    {/* Notifications */}
                    <Route path="notifications/:id" element={<NotificationDetails />} />

                    {/* System Monitor */}
                    <Route path="monitor" element={<MonitoringDashboard />} />

                    <Route path="*" element={<div className="p-6 text-muted-foreground">Page Not Found</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
