import React from 'react';
import Card from '../../components/ui/Card';

const AnnouncementShell = ({ title }) => (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Card className="min-h-[400px] flex items-center justify-center border-dashed border-white/10 bg-[#050505]">
            <div className="text-center space-y-2 opacity-60">
                <h3 className="text-lg font-medium text-white">Announcement Module</h3>
                <p className="text-xs text-muted-foreground">Broadcast updates to users.</p>
            </div>
        </Card>
    </div>
);

export const AllAnnouncements = () => <AnnouncementShell title="All Announcements" />;
export const CreateAnnouncement = () => <AnnouncementShell title="Compose New Announcement" />;
