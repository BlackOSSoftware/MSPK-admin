import React, { useState, useEffect } from 'react';
import { Download, ShoppingCart } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SubscriptionTable from '../../components/tables/SubscriptionTable';

const PurchaseHistory = () => {
    const [loading, setLoading] = useState(true);

    // Mock Data
    const purchases = [
        { id: 'INV-2024-001', user: 'Rajesh Kumar', plan: 'Gold Membership', amount: 4999, date: '12 Jan 2024', method: 'UPI', status: 'Success' },
        { id: 'INV-2024-002', user: 'Amit Singh', plan: 'Silver Membership', amount: 2499, date: '11 Jan 2024', method: 'Credit Card', status: 'Success' },
        { id: 'INV-2024-003', user: 'Sneha Gupta', plan: 'Platinum Membership', amount: 9999, date: '10 Jan 2024', method: 'UPI', status: 'Failed' },
        { id: 'INV-2024-004', user: 'Vikram Malhotra', plan: 'Gold Membership', amount: 4999, date: '09 Jan 2024', method: 'Netbanking', status: 'Success' },
    ];

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Global Purchase History</h1>
                    <p className="text-muted-foreground text-sm">All transactions across the platform</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download size={14} /> Export CSV
                    </Button>
                </div>
            </div>

            <SubscriptionTable transactions={purchases} isLoading={loading} />
        </div>
    );
};

export default PurchaseHistory;
