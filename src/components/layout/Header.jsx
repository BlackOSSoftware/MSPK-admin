import React from 'react';
import { Search, Bell, LogOut, Menu, Sun, Moon, X, Check, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme-provider';
import TickerMarquee from './TickerMarquee';
import { globalSearch } from '../../api/search.api';
import { getMyNotifications, markAsRead, markAllAsRead } from '../../api/notifications.api';
import { formatDistanceToNow } from 'date-fns';

const Header = ({ onMenuClick }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { theme, setTheme } = useTheme();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

    // Search
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [showResults, setShowResults] = React.useState(false);
    const searchRef = React.useRef(null);

    React.useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await globalSearch(searchQuery);
                    setSearchResults(res.data);
                    setShowResults(true);
                } catch (err) {
                    console.error('Search failed', err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Click outside to close search
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
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

    const handleMarkRead = async (id, link) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (link) navigate(link);
        } catch (err) {
            console.error(err);
        }
    };

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
        <div className="h-8 bg-card border-b border-border flex items-center justify-between px-2 sticky top-0 z-50">

            {/* Left: Branding & Search */}
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onMenuClick} className="md:hidden text-muted-foreground hover:text-foreground p-1">
                    <Menu size={16} />
                </button>
            </div>

            {/* News Ticker */}
            <div className="flex-1 min-w-0 mx-2 md:mx-4 overflow-hidden mask-linear-fade relative h-full flex items-center">
                <TickerMarquee />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Unified Search Bar */}
                <div className={`relative group transition-all duration-300 ${isMobileSearchOpen ? 'w-full absolute left-0 top-0 h-full bg-card z-50 px-2 flex items-center' : ''}`} ref={searchRef}>
                    {isSearching ? (
                        <Loader2
                            className={`md:absolute md:left-2.5 md:top-1/2 md:-translate-y-1/2 text-primary animate-spin ${isMobileSearchOpen ? 'mr-2' : ''}`}
                            size={14}
                        />
                    ) : (
                        <Search
                            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            className={`md:absolute md:left-2.5 md:top-1/2 md:-translate-y-1/2 text-muted-foreground cursor-pointer md:cursor-text ${isMobileSearchOpen ? 'mr-2' : ''}`}
                            size={14}
                        />
                    )}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchQuery.length >= 2) setShowResults(true); }}
                        placeholder="Search (type 2+ chars)..."
                        className={`${isMobileSearchOpen ? 'block w-full' : 'hidden md:block'} bg-secondary/30 border border-white/5 h-6 pl-2 md:pl-8 pr-3 w-full md:w-32 lg:w-48 text-[11px] font-medium rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50`}
                        autoFocus={isMobileSearchOpen}
                    />
                    {isMobileSearchOpen && (
                        <X size={14} className="ml-2 text-muted-foreground cursor-pointer" onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }} />
                    )}

                    {/* Search Results Dropdown */}
                    {showResults && (
                        <div className="absolute top-8 left-0 w-full md:w-80 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/20">
                                {isSearching ? 'Searching...' : `Found ${searchResults.length} results`}
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {searchResults.length > 0 ? searchResults.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            const isSignal = ['signal', 'SIGNAL'].includes(item.type);
                                            let link = item.link;

                                            if (item.type === 'SIGNAL' || item.type === 'signal') {
                                                const isClosed = item.subtitle?.toLowerCase().includes('closed');
                                                link = `${item.link}?search=${encodeURIComponent(item.title)}&highlightId=${item.id}&tab=${isClosed ? 'history' : 'live'}`;
                                            } else if (item.type === 'PLAN' || item.type === 'plan') {
                                                link = `/plans/all?search=${encodeURIComponent(item.title)}`;
                                            } else if (item.type === 'USER' || item.type === 'user') {
                                                // Override backend deep-link to use table search view
                                                link = `/users/all?search=${encodeURIComponent(item.title)}`;
                                            } else if (item.type === 'TICKET' || item.type === 'ticket') {
                                                // Override backend deep-link to use table search view
                                                link = `/tickets/all?search=${encodeURIComponent(item.subtitle || item.title)}`;
                                            }

                                            navigate(link);
                                            setShowResults(false);
                                            setIsMobileSearchOpen(false);
                                        }}
                                        className="px-3 py-2 hover:bg-muted/50 cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-foreground">{item.title}</span>
                                            <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                                        </div>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">{item.type}</span>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        {!isSearching && "No results found."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifOpen(!showNotifOpen)}
                        className="relative p-1.5 text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                    >
                        <Bell size={14} />
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



                <button
                    onClick={handleLogout}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut size={12} />
                </button>
            </div>
        </div>
    );
};

export default Header;
