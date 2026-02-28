import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Trash2, Calendar, Clock, Info } from 'lucide-react';
import { getNotificationById, deleteNotification, markAsRead } from '../../api/notifications.api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useToast from '../../hooks/useToast';
import { format } from 'date-fns';

const NotificationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadNotification = async () => {
            if (isDeleting) return;
            try {
                const res = await getNotificationById(id);
                setNotification(res.data);

                // Mark as read if not already
                if (!res.data.isRead) {
                    await markAsRead(id);
                }
            } catch (err) {
                console.error("Failed to load notification", err);
                toast.error("Notification not found or access denied");
                navigate(-1);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadNotification();
    }, [id, navigate, toast, isDeleting]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this notification?")) return;

        setIsDeleting(true);
        try {
            await deleteNotification(id);
            toast.success("Notification deleted successfully");
            navigate(-1);
        } catch (err) {
            console.error("Delete failed", err);
            toast.error("Failed to delete notification");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!notification) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                </button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 gap-2"
                >
                    <Trash2 size={16} />
                    {isDeleting ? 'Deleting...' : 'Delete Notification'}
                </Button>
            </div>

            <Card className="bg-[#050505] border-white/5 relative overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                            <Bell size={24} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-foreground leading-tight">
                                    {notification.title}
                                </h1>
                                {!notification.isRead && (
                                    <span className="px-1.5 py-0.5 rounded bg-primary text-[8px] font-bold uppercase text-white animate-pulse">New</span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-primary/60" />
                                    {format(new Date(notification.createdAt), 'dd MMM yyyy')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-primary/60" />
                                    {format(new Date(notification.createdAt), 'hh:mm a')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <div className="prose prose-invert max-w-none">
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans">
                            {notification.message}
                        </p>
                    </div>

                    {notification.link && (
                        <div className="pt-4 border-t border-white/5">
                            <Button
                                variant="primary"
                                onClick={() => navigate(notification.link)}
                                className="w-full md:w-auto px-8 gap-2 group shadow-xl shadow-primary/10"
                            >
                                <Info size={16} />
                                View Related Page
                                <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Footer Reminder */}
            <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-mono opacity-50">
                    ID: {notification._id}
                </p>
            </div>
        </div>
    );
};

export default NotificationDetails;
