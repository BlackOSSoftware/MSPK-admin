import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, CreditCard,
    BarChart2, Settings, FileText, X, AlignLeft,
    RefreshCcw, Radio, MessageSquare, Megaphone, PieChart,
    ChevronLeft, ChevronRight, Activity, Command, Cpu, Wifi, Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSystemHealth } from '../../api/system.api';

const SidebarItem = ({ icon: Icon, label, to, collapsed }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            twMerge(
                "flex items-center gap-3 px-4 py-2.5 w-full border-b border-border transition-all duration-300 group relative",
                isActive
                    ? "bg-primary/10 text-primary border-r-2 border-r-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
            )
        }
    >
        {({ isActive }) => (
            <>
                <Icon
                    size={16}
                    className={clsx(
                        "shrink-0 transition-all duration-300 z-10",
                        isActive ? "text-primary drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "group-hover:text-foreground"
                    )}
                />

                <span className={clsx(
                    "text-[11px] font-semibold tracking-tight transition-all duration-300 z-10 whitespace-nowrap",
                    collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                )}>
                    {label}
                </span>

                {/* Glow effect */}
                {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
            </>
        )}
    </NavLink>
);

const SidebarGroup = ({ icon: Icon, label, children, collapsed }) => {
    const [isGroupOpen, setIsGroupOpen] = useState(false);

    return (
        <div className="w-full">
            <button
                onClick={() => setIsGroupOpen(!isGroupOpen)}
                className={twMerge(
                    "flex items-center gap-3 px-4 py-2.5 w-full text-left border-b border-border transition-all duration-300 group relative hover:bg-accent/10",
                    isGroupOpen ? "text-foreground bg-accent/5" : "text-muted-foreground"
                )}
            >
                <Icon size={16} className={clsx("shrink-0 transition-colors", isGroupOpen && "text-primary")} />
                <span className={clsx("text-[11px] font-semibold tracking-tight transition-all duration-300", collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block")}>
                    {label}
                </span>
                {!collapsed && (
                    <div className={clsx("ml-auto transition-transform duration-300", isGroupOpen ? "rotate-90" : "")}>
                        <ChevronRight size={12} />
                    </div>
                )}
            </button>
            <div className={clsx("overflow-hidden transition-all duration-300 bg-black/20", isGroupOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                <div className="">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ isOpen, onClose }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [systemHealth, setSystemHealth] = useState({ serverLoad: 0, memoryUsage: 0 });

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const data = await getSystemHealth();
                setSystemHealth(data);
            } catch (error) {
                console.error("Failed to fetch system health", error);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const navigation = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'All Users', path: '/users/all', icon: Users },
        { name: 'Plans', path: '/plans/all', icon: CreditCard },
        { name: 'Subscriptions', path: '/subscriptions/all', icon: RefreshCcw },
        { name: 'Signals', path: '/signals/all', icon: Radio },
        { name: 'Strategies', path: '/strategies/all', icon: Cpu },
        {
            name: 'Market Data',
            icon: BarChart2,
            submenu: [
                { name: 'Live Market', path: '/market/data', icon: Activity },
                { name: 'Manage Symbols', path: '/market/symbols', icon: Settings }
            ]
        },
        { name: 'Support Tickets', path: '/tickets/all', icon: MessageSquare },
        { name: 'Inquiries', path: '/leads/all', icon: Users }, // Added Leads
        { name: 'Reports', path: '/reports/all', icon: PieChart },
        {
            name: 'Announcements',
            icon: Megaphone,
            submenu: [
                { name: 'All News', path: '/announcements/all', icon: Megaphone },
                { name: 'Economic Calendar', path: '/announcements/calendar', icon: Calendar }
            ]
        },
        { name: 'CMS', path: '/cms/all', icon: FileText },
        { name: 'Sub Brokers', path: '/brokers/all', icon: Users }, // Reusing Users icon or similar
        {
            name: 'Settings',
            icon: Settings,
            submenu: [
                { name: 'General', path: '/settings/all', icon: Settings },
                { name: 'System Monitor', path: '/monitor', icon: Activity },
                { name: 'Notifications', path: '/settings/notifications', icon: MessageSquare }
            ]
        },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div
                className={clsx(
                    "fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] shadow-2xl md:shadow-none",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    collapsed ? "md:w-14" : "md:w-60",
                    "w-60 md:static"
                )}
            >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/2 via-transparent to-transparent pointer-events-none opacity-20" />

                {/* Header / Brand */}
                <div className={clsx("h-8 flex items-center border-b border-border px-4 shrink-0 relative z-10", collapsed ? "justify-center px-0" : "justify-between")}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img
                            src="/logo.jpeg"
                            alt="MSPK Trade Solutions"
                            className="w-6 h-6 object-contain rounded-sm shrink-0"
                        />
                        <div className={clsx("flex flex-col transition-all duration-300", collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block")}>
                            <span className="text-[10px] font-black tracking-tighter text-foreground leading-none">MSPK <span className="text-primary">TRADE SOLUTIONS</span></span>
                        </div>
                    </div>
                    <div className={clsx("transition-all duration-300", collapsed ? "hidden" : "block")}>
                        <span className="text-[8px] font-bold text-muted-foreground tracking-wider border border-border bg-accent/5 px-1 rounded-sm">v1.0.0</span>
                    </div>
                </div>

                {/* Section Divider */}
                {!collapsed && <div className="px-4 py-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest relative z-10 border-b border-border opacity-50">Main Menu</div>}

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    {navigation.map((item, index) => (
                        <React.Fragment key={item.name}>
                            {item.submenu ? (
                                <SidebarGroup icon={item.icon} label={item.name} collapsed={collapsed}>
                                    {item.submenu.map((subItem) => (
                                        <SidebarItem
                                            key={subItem.name}
                                            icon={subItem.icon}
                                            label={subItem.name}
                                            to={subItem.path}
                                            collapsed={collapsed}
                                        />
                                    ))}
                                </SidebarGroup>
                            ) : (
                                <SidebarItem
                                    icon={item.icon}
                                    label={item.name}
                                    to={item.path}
                                    collapsed={collapsed}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>


                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-2 top-10 w-4 h-4 bg-card border border-primary/50 rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform z-50 md:flex hidden"
                >
                    {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
                </button>

                {/* System Status */}
                <div className="border-t border-border bg-accent/5 backdrop-blur-sm">
                    {(!collapsed) ? (
                        <div className="px-4 py-3 space-y-3">
                            <div className="space-y-2">
                                {/* CPU Load */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={10} />
                                            <span>Server Load</span>
                                        </div>
                                        <span className="text-xs font-mono text-foreground">{systemHealth.serverLoad}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-accent/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.min(systemHealth.serverLoad, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-3">
                            <Activity size={14} className="text-primary hover:animate-spin cursor-pointer" />
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
