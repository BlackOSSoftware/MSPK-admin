import React from 'react';
import { Bell, Menu, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme-provider';
import { useSound } from '../../context/SoundContext';
import { getMyNotifications, markAsRead, markAllAsRead } from '../../api/notifications.api';
import { formatDistanceToNow } from 'date-fns';

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { resolvedMode, setTheme } = useTheme();
    const { isMuted, toggleMute } = useSound();
    const isDarkMode = resolvedMode === 'dark';

    // Click outside to close search
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Notifications
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showNotifOpen, setShowNotifOpen] = React.useState(false);
    const notifRef = React.useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await getMyNotifications();
            setNotifications(res.data.results);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    React.useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-12 bg-card border-b border-border flex items-center justify-between px-3 md:px-4 sticky top-0 z-50 shadow-none">

            {/* Left */}
            <div className="flex items-center gap-3 shrink-0">
                <button onClick={onMenuClick} className="md:hidden text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent/10 transition-colors">
                    <Menu size={18} />
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="h-6 w-px bg-border/70 mx-1 hidden sm:block"></div>

                <button
                    onClick={toggleMute}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-accent/10 rounded-lg transition-all"
                    title={isMuted ? "Unmute UI" : "Mute UI"}
                >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button
                    onClick={() => {
                        if (isDarkMode) {
                            setTheme('light');
                            return;
                        }
                        setTheme(localStorage.getItem('theme-dark') || 'theme-royal');
                    }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-accent/10 rounded-lg transition-all"
                    title="Toggle Theme"
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifOpen(!showNotifOpen)}
                        className="relative p-2 text-muted-foreground hover:text-primary hover:bg-accent/10 rounded-lg transition-all"
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background animate-pulse"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifOpen && (
                        <div className="absolute top-8 right-0 w-72 md:w-80 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
                                <h3 className="text-xs font-bold uppercase tracking-wider">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-[10px] text-primary hover:text-primary/80 font-medium">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            onClick={() => {
                                                setShowNotifOpen(false);
                                                navigate(`/notifications/${notif._id}`);
                                            }}
                                            className={`p-3 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <p className={`text-xs ${!notif.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <span className="text-[9px] text-muted-foreground/60 mt-1 block">
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-muted-foreground text-xs">
                                        No notifications
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Header;
