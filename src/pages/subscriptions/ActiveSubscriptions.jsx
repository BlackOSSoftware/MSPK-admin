import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import ActiveSubscriptionsTable from '../../components/tables/ActiveSubscriptionsTable';

const ActiveSubscriptions = () => {
    const [loading, setLoading] = useState(true);

    // Mock Data
    const subscriptions = [
        { user: 'Rajesh Kumar', userId: 'USR001', plan: 'Gold Plan', startDate: '12 Jan 2024', expiryDate: '12 Feb 2024', daysRemaining: 20, lastLoginIp: '192.168.1.1' },
        { user: 'Amit Singh', userId: 'USR002', plan: 'Silver Plan', startDate: '10 Jan 2024', expiryDate: '10 Feb 2024', daysRemaining: 18, lastLoginIp: '192.168.1.2' },
        { user: 'Sneha Gupta', userId: 'USR003', plan: 'Platinum Plan', startDate: '05 Jan 2024', expiryDate: '05 Feb 2024', daysRemaining: 4, lastLoginIp: '192.168.1.3' },
        { user: 'Vikram Malhotra', userId: 'USR004', plan: 'Gold Plan', startDate: '01 Jan 2024', expiryDate: '31 Jan 2024', daysRemaining: 2, lastLoginIp: '192.168.1.4' },
    ];

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Active Subscriptions</h1>
                    <p className="text-muted-foreground text-sm">Manage user subscriptions and validity</p>
                </div>
            </div>

            <ActiveSubscriptionsTable subscriptions={subscriptions} isLoading={loading} />
        </div>
    );
};

export default ActiveSubscriptions;
