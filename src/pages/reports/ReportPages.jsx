import React from 'react';
import Card from '../../components/ui/Card';

const ReportShell = ({ title }) => (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Card className="min-h-[400px] flex items-center justify-center border-dashed border-white/10 bg-[#050505]">
            <div className="text-center space-y-2 opacity-60">
                <h3 className="text-lg font-medium text-white">Analytics Dashboard</h3>
                <p className="text-xs text-muted-foreground">Detailed analytical reports coming soon.</p>
            </div>
        </Card>
    </div>
);

export const RevenueReport = () => <ReportShell title="Revenue Analysis" />;
export const SubscriptionReport = () => <ReportShell title="Subscription Growth Report" />;
export const SignalPerformanceReport = () => <ReportShell title="Signal Accuracy Report" />;
