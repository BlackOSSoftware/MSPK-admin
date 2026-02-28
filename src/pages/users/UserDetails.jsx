
import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, CreditCard, Shield, Activity, ArrowLeft, History } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useToast from '../../hooks/useToast';

import SubscriptionHistory from './SubscriptionHistory';
import SignalsAccess from './SignalsAccess';

const UserDetails = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id');
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { fetchUserById } = await import('../../api/users.api');
                const { data } = await fetchUserById(userId);
                setUser(data);
            } catch (error) {
                console.error("Failed to load user", error);
                toast.error("Failed to load client details");
                navigate('/users/all');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadUser();
        }
    }, [userId, navigate, toast]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'history', label: 'Subscription History', icon: History },
        { id: 'signals', label: 'Signals Access', icon: Activity },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse"></div>
                        <div>
                            <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-48 bg-muted/50 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-9 w-24 bg-muted/50 rounded animate-pulse"></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex items-center gap-1 border-b border-white/5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="px-4 py-3">
                            <div className="h-5 w-24 bg-muted/50 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>

                {/* Content Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card Skeleton */}
                    <Card className="md:col-span-2 bg-secondary/20 border-white/5" noPadding>
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-muted/50 animate-pulse"></div>
                                <div>
                                    <div className="h-6 w-48 bg-muted/50 rounded animate-pulse mb-2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-5 w-16 bg-muted/50 rounded animate-pulse"></div>
                                        <div className="h-5 w-20 bg-muted/50 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-24 bg-muted/50 rounded animate-pulse"></div>
                                    <div className="h-5 w-40 bg-muted/50 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Stats Skeleton */}
                    <div className="space-y-6">
                        <Card className="bg-muted/10 border-white/5">
                            <div className="h-5 w-32 bg-muted/50 rounded animate-pulse mb-4"></div>
                            <div className="h-8 w-40 bg-muted/50 rounded animate-pulse mb-2"></div>
                            <div className="h-3 w-full bg-muted/50 rounded animate-pulse"></div>
                        </Card>
                        <Card className="bg-muted/10 border-white/5">
                            <div className="h-5 w-32 bg-muted/50 rounded animate-pulse mb-4"></div>
                            <div className="h-8 w-40 bg-muted/50 rounded animate-pulse mb-2"></div>
                            <div className="h-3 w-full bg-muted/50 rounded animate-pulse"></div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">User Profile</h1>
                        <p className="text-muted-foreground text-sm">View and manage client information</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(`/users/edit?id=${user.id}`)}>
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2
                            ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/10'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Main Profile Card */}
                        <Card className="md:col-span-2 bg-secondary/20 border-white/5" noPadding>
                            <div className="p-6 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {user.status}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase font-bold tracking-wider">
                                                {user.kycStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Email Address</label>
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Mail size={14} className="text-primary" /> {user.email}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Phone Number</label>
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Phone size={14} className="text-primary" /> {user.phone || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Member Since</label>
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Calendar size={14} className="text-primary" /> {new Date(user.joinDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Current Plan</label>
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Shield size={14} className="text-primary" /> {user.plan}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Stats Card */}
                        <div className="space-y-6">
                            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <CreditCard className="text-primary" size={20} />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</h3>
                                </div>
                                <div className="text-3xl font-bold text-foreground">₹ {user.walletBalance.toLocaleString()}</div>
                                <div className="mt-2 text-xs text-muted-foreground">Available for trading & withdrawals</div>
                            </Card>

                            <Card className="bg-[#050505] border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Activity className="text-orange-500" size={20} />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Client ID</h3>
                                </div>
                                <div className="text-2xl font-bold font-mono text-foreground mb-1">{user.clientId}</div>
                                <div className="text-xs text-muted-foreground flex justify-between">
                                    <span>Broker: {user.subBrokerName}</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SubscriptionHistory isEmbedded data={user.subscriptionHistory} />
                    </div>
                )}

                {activeTab === 'signals' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SignalsAccess isEmbedded data={user.signals} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetails;
