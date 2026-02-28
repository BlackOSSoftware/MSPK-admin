import React from 'react';
import Card from '../../components/ui/Card';

const CMSShell = ({ title }) => (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Card className="min-h-[400px] flex items-center justify-center border-dashed border-white/10 bg-[#050505]">
            <div className="text-center space-y-2 opacity-60">
                <h3 className="text-lg font-medium text-white">CMS Editor</h3>
                <p className="text-xs text-muted-foreground">Content Management System interface.</p>
            </div>
        </Card>
    </div>
);

export const Terms = () => <CMSShell title="Terms of Service" />;
export const PrivacyPolicy = () => <CMSShell title="Privacy Policy" />;
export const RefundPolicy = () => <CMSShell title="Refund Policy" />;
export const AboutUs = () => <CMSShell title="About Us Page" />;
export const FAQs = () => <CMSShell title="Frequently Asked Questions" />;
