import React from 'react';
import Card from '../../components/ui/Card';

const PageShell = ({ title, description }) => (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Card className="min-h-[400px] flex items-center justify-center border-dashed border-white/10 bg-[#050505]">
            <div className="text-center space-y-2 opacity-60">
                <h3 className="text-lg font-medium text-white">Module Ready</h3>
                <p className="text-xs text-muted-foreground">Detailed implementation coming in next phase.</p>
            </div>
        </Card>
    </div>
);

export const AllPurchases = () => <PageShell title="All Purchases" description="Complete record of all plan purchases" />;
export const ExpiredSubscriptions = () => <PageShell title="Expired Subscriptions" description="List of users with lapsed memberships" />;
export const ExtendSubscription = () => <PageShell title="Extend Subscription" description="Manually add validity to a user's plan" />;
export const AssignPlan = () => <PageShell title="Assign Plan" description="Manually assign a new plan to a user" />;

export const SignalCategories = () => <PageShell title="Signal Categories" description="Manage trading segments (Nifty, BankNifty, etc.)" />;
export const SignalHistory = () => <PageShell title="Signal History" description="Archive of past trading calls" />;
export const EditSignal = () => <PageShell title="Edit Signal" description="Modify an active trading signal" />;
