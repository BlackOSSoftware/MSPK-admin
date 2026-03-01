import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, CreditCard,
    BarChart2, Settings, FileText,
    RefreshCcw, Radio, MessageSquare, Megaphone,
    ChevronLeft, ChevronRight, ChevronDown, Activity, Calendar, LogOut, X
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const isPathActive = (pathname, targetPath) =>
    pathname === targetPath || pathname.startsWith(`${targetPath}/`);

const SidebarItem = ({ icon: Icon, label, to, collapsed, onNavigate, variant = 'item' }) => (
    <NavLink
        to={to}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
            twMerge(
                "group relative flex items-center gap-3 w-full rounded-xl border transition-all duration-200 outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                variant === 'sub'
                    ? (collapsed ? "my-0.5 px-2 py-2" : "my-0.5 px-3 py-2")
                    : "my-0.5 px-3 py-2.5",
                collapsed && "justify-center",
                isActive
                    ? "bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-primary/25 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-border/60"
            )
        }
    >
        {({ isActive }) => (
            <>
                <span
                    className={twMerge(
                        "grid place-items-center shrink-0 rounded-lg border bg-accent/10",
                        variant === 'sub' ? "h-7 w-7" : "h-8 w-8",
                        isActive
                            ? "border-primary/30 text-primary bg-primary/10"
                            : "border-border/50 text-muted-foreground group-hover:text-foreground"
                    )}
                >
                    <Icon size={16} />
                </span>

                <span
                    className={clsx(
                        "min-w-0 text-[11px] font-semibold tracking-tight whitespace-nowrap transition-all duration-200",
                        collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                    )}
                >
                    {label}
                </span>

                
            </>
        )}
    </NavLink>
);

const SidebarGroup = ({ icon: Icon, label, submenu = [], collapsed, onNavigate }) => {
    const location = useLocation();
    const hasActiveChild = submenu.some((subItem) => isPathActive(location.pathname, subItem.path));
    const [isGroupOpen, setIsGroupOpen] = useState(hasActiveChild);

    useEffect(() => {
        if (hasActiveChild) setIsGroupOpen(true);
    }, [hasActiveChild]);

    return (
        <div className="w-full">
            <button
                type="button"
                onClick={() => setIsGroupOpen((prev) => !prev)}
                title={collapsed ? label : undefined}
                className={twMerge(
                    "group relative flex items-center gap-3 w-full rounded-xl border transition-all duration-200 outline-none",
                    "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "my-0.5 px-3 py-2.5",
                    collapsed && "justify-center",
                    hasActiveChild
                        ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-border/60"
                )}
            >
                <span
                    className={twMerge(
                        "grid place-items-center shrink-0 rounded-lg border bg-accent/10",
                        "h-8 w-8",
                        hasActiveChild || isGroupOpen
                            ? "border-primary/30 text-primary bg-primary/10"
                            : "border-border/50 text-muted-foreground group-hover:text-foreground"
                    )}
                >
                    <Icon size={16} />
                </span>

                <span
                    className={clsx(
                        "min-w-0 text-[11px] font-semibold tracking-tight whitespace-nowrap transition-all duration-200",
                        collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                    )}
                >
                    {label}
                </span>

                {!collapsed && (
                    <span className={clsx("ml-auto transition-transform duration-200", isGroupOpen ? "rotate-180" : "rotate-0")}>
                        <ChevronDown size={14} />
                    </span>
                )}

                
            </button>

            <div
                className={clsx(
                    "grid transition-all duration-300",
                    isGroupOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className={twMerge("mt-1 space-y-1 pb-1", collapsed ? "px-0" : "pl-6 pr-2")}>
                        {submenu.map((subItem) => (
                            <SidebarItem
                                key={subItem.name}
                                icon={subItem.icon}
                                label={subItem.name}
                                to={subItem.path}
                                collapsed={collapsed}
                                onNavigate={onNavigate}
                                variant="sub"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RailLink = ({ icon: Icon, label, to, active, onNavigate }) => (
    <NavLink
        to={to}
        onClick={onNavigate}
        title={label}
        className={twMerge(
            "relative mx-2 my-1 grid place-items-center h-10 w-10 rounded-xl border transition-all duration-200 outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            active
                ? "bg-gradient-to-br from-primary/15 to-transparent border-primary/25 text-primary"
                : "bg-accent/5 border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-border/70"
        )}
        aria-current={active ? "page" : undefined}
    >
        <Icon size={18} />
    </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
        onClose?.();
        navigate('/login');
    };

    const handleNavigate = () => {
        onClose?.();
    };

    const navigationSections = [
        {
            title: 'Overview',
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            ],
        },
        {
            title: 'Management',
            items: [
                { name: 'All Users', path: '/users/all', icon: Users },
                { name: 'Plans', path: '/plans/all', icon: CreditCard },
                { name: 'Subscriptions', path: '/subscriptions/all', icon: RefreshCcw },
                { name: 'Sub Brokers', path: '/brokers/all', icon: Users },
            ],
        },
        {
            title: 'Trading',
            items: [
                { name: 'Signals', path: '/signals/all', icon: Radio },
                {
                    name: 'Market Data',
                    icon: BarChart2,
                    submenu: [
                        { name: 'Live Market', path: '/market/data', icon: Activity },
                        { name: 'Manage Symbols', path: '/market/symbols', icon: Settings },
                    ],
                },
            ],
        },
        {
            title: 'Support',
            items: [
                { name: 'Support Tickets', path: '/tickets/all', icon: MessageSquare },
                { name: 'Inquiries', path: '/leads/all', icon: Users },
            ],
        },
        {
            title: 'Content',
            items: [
                {
                    name: 'Announcements',
                    icon: Megaphone,
                    submenu: [
                        { name: 'All News', path: '/announcements/all', icon: Megaphone },
                        { name: 'Economic Calendar', path: '/announcements/calendar', icon: Calendar },
                    ],
                },
                { name: 'CMS', path: '/cms/all', icon: FileText },
            ],
        },
        {
            title: 'Preferences',
            items: [
                {
                    name: 'Settings',
                    icon: Settings,
                    submenu: [
                        { name: 'General', path: '/settings/all', icon: Settings },
                        { name: 'Notifications', path: '/settings/notifications', icon: MessageSquare },
                    ],
                },
            ],
        },
    ];

    const railLinks = [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, isActive: (p) => p === '/' || p.startsWith('/dashboard') },
        { label: 'Users', to: '/users/all', icon: Users, isActive: (p) => p.startsWith('/users') },
        { label: 'Plans', to: '/plans/all', icon: CreditCard, isActive: (p) => p.startsWith('/plans') },
        { label: 'Subscriptions', to: '/subscriptions/all', icon: RefreshCcw, isActive: (p) => p.startsWith('/subscriptions') },
        { label: 'Signals', to: '/signals/all', icon: Radio, isActive: (p) => p.startsWith('/signals') },
        { label: 'Market', to: '/market/data', icon: Activity, isActive: (p) => p.startsWith('/market') },
        { label: 'Tickets', to: '/tickets/all', icon: MessageSquare, isActive: (p) => p.startsWith('/tickets') },
        { label: 'News', to: '/announcements/all', icon: Megaphone, isActive: (p) => p.startsWith('/announcements') },
    ];

    const railContent = (
        <>
            <div className="relative z-10 px-2 pt-3 pb-2 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-accent/10 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                        src="/logo.jpeg"
                        alt="MSPK Trade Solutions"
                        className="h-6 w-6 object-contain"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setCollapsed((prev) => !prev)}
                    className={twMerge(
                        "h-10 w-10 rounded-xl border transition-colors cursor-grab active:cursor-grabbing",
                        "text-muted-foreground hover:text-foreground hover:bg-accent/10",
                        "border-border/40 bg-accent/5"
                    )}
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    {collapsed ? <ChevronRight size={18} className="mx-auto" /> : <ChevronLeft size={18} className="mx-auto" />}
                </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-2">
                {railLinks.map((link) => (
                    <RailLink
                        key={link.label}
                        icon={link.icon}
                        label={link.label}
                        to={link.to}
                        active={link.isActive(location.pathname)}
                        onNavigate={handleNavigate}
                    />
                ))}
            </div>

            <div className="relative z-10 border-t border-border/60 px-2 py-3 flex flex-col items-center gap-2">
                <RailLink
                    icon={Settings}
                    label="Settings"
                    to="/settings/all"
                    active={location.pathname.startsWith('/settings')}
                    onNavigate={handleNavigate}
                />
                <button
                    type="button"
                    onClick={handleLogout}
                    title="Logout"
                    className={twMerge(
                        "relative mx-2 my-1 grid place-items-center h-10 w-10 rounded-xl border transition-all duration-200 outline-none",
                        "focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "bg-accent/5 border-border/40 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                    )}
                >
                    <LogOut size={18} />
                </button>
            </div>
        </>
    );

    const panelContent = (
        <>
            {/* Panel Header */}
            <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 border-b border-border/60 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                            src="/logo.jpeg"
                            alt="MSPK Trade Solutions"
                            className="h-6 w-6 object-contain"
                        />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <p className="text-sm font-bold tracking-tight text-foreground truncate">MSPK Trade Solutions</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">Admin Console</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setCollapsed((prev) => !prev)}
                        className={twMerge(
                            "hidden md:inline-flex p-2 rounded-lg border transition-colors cursor-grab active:cursor-grabbing",
                            "text-muted-foreground hover:text-foreground hover:bg-accent/10",
                            "border-border/40 bg-accent/5"
                        )}
                        title={collapsed ? "Expand" : "Minimize"}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-1.5 py-3">
                {navigationSections.map((section) => (
                    <div key={section.title} className="mb-2">
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <React.Fragment key={item.name}>
                                    {item.submenu ? (
                                        <SidebarGroup
                                            icon={item.icon}
                                            label={item.name}
                                            submenu={item.submenu}
                                            collapsed={false}
                                            onNavigate={handleNavigate}
                                        />
                                    ) : (
                                        <SidebarItem
                                            icon={item.icon}
                                            label={item.name}
                                            to={item.path}
                                            collapsed={false}
                                            onNavigate={handleNavigate}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Panel Footer (Mobile) */}
            <div className="relative z-10 border-t border-border/60 px-1.5 py-3 md:hidden">
                <button
                    type="button"
                    onClick={handleLogout}
                    className={twMerge(
                        "group relative flex items-center gap-3 w-full rounded-xl border transition-all duration-200 outline-none",
                        "focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "px-3 py-2.5",
                        "border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                    )}
                >
                    <span
                        className={twMerge(
                            "grid place-items-center shrink-0 h-8 w-8 rounded-lg border bg-accent/10",
                            "border-border/50 text-muted-foreground group-hover:text-destructive"
                        )}
                    >
                        <LogOut size={16} />
                    </span>
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                        Logout
                    </span>
                </button>

                <div className="px-4 pt-3 text-[9px] text-muted-foreground/60 font-mono">
                    v1.0.0
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 z-30 bg-background/40 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 shrink-0 md:static md:translate-x-0",
                    "transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="h-full p-2">
                    {/* Desktop */}
                    <div className="hidden md:block h-full">
                        {collapsed ? (
                            <div className="h-full w-16 flex flex-col rounded-2xl border border-border/60 bg-secondary/60 backdrop-blur-xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                                {railContent}
                            </div>
                        ) : (
                            <div className="h-full w-72 flex flex-col rounded-2xl border border-border/60 bg-secondary/60 backdrop-blur-xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                                {panelContent}
                            </div>
                        )}
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden h-full">
                        <div className="h-full w-[85vw] max-w-[360px] flex flex-col rounded-2xl border border-border/60 bg-secondary/60 backdrop-blur-xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none opacity-60" />
                            {panelContent}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
