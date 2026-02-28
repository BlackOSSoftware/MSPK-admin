import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, TrendingUp, Users, DollarSign, Wallet } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import UserTable from '../../components/tables/UserTable';
import { getSubBroker, processPayout } from '../../api/subbrokers.api';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const StatCard = ({ label, value, icon: Icon, subValue, highlight, actionLabel, onAction }) => (
    <Card className="p-4 bg-[#050505] border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Icon size={48} />
        </div>
        <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <Icon size={12} /> {label}
                </div>
                {actionLabel && onAction && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(); }}
                        className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase transition-colors"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            <div className={`text-2xl font-black tracking-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>
                {value}
            </div>
            {subValue && <div className="text-[10px] text-muted-foreground">{subValue}</div>}
        </div>
    </Card>
);

const BrokerDetails = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const brokerID = searchParams.get('id');
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [broker, setBroker] = useState(null);
    const [clients, setClients] = useState([]);
    const [commissions, setCommissions] = useState([]);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const { data } = await getSubBroker(brokerID);
            setBroker(data.subBroker);
            setClients(data.clients || []);
            setCommissions(data.commissions || []);
        } catch (error) {
            console.error("Failed to fetch broker details", error);
            toast.error("Failed to load broker details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!brokerID) {
            navigate('/brokers/all');
            return;
        }
        fetchDetails();
    }, [brokerID, navigate]);

    // Payout Action
    const handlePayoutClick = () => {
        const pendingAmount = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + (c.amount || 0), 0);
        if (pendingAmount <= 0) return;

        setPendingAction({ type: 'payout' });
        setDialogConfig({
            title: 'Process Payout',
            message: `Mark total pending amount of ₹${pendingAmount.toLocaleString()} as PAID? This will update all pending commissions status.`,
            variant: 'primary',
            confirmText: 'Mark as Paid'
        });
        setDialogOpen(true);
    };

    // Client Action Handlers
    const handleClientAction = (action, user) => {
        if (action === 'view') {
            navigate(`/users/details?id=${user.id}`);
        } else if (action === 'edit') {
            navigate(`/users/edit?id=${user.id}`);
        } else if (action === 'delete') {
            setPendingAction({ type: 'delete', user });
            setDialogConfig({
                title: 'Delete Client',
                message: `Are you sure you want to PERMANENTLY DELETE ${user.name}? This action cannot be undone.`,
                variant: 'danger',
                confirmText: 'Delete Client'
            });
            setDialogOpen(true);
        } else if (action === 'block') {
            const isBlocking = user.status !== 'Blocked';
            setPendingAction({ type: 'block', user });
            setDialogConfig({
                title: isBlocking ? 'Block Client' : 'Unblock Client',
                message: `Are you sure you want to ${isBlocking ? 'BLOCK' : 'UNBLOCK'} ${user.name}?`,
                variant: isBlocking ? 'danger' : 'primary',
                confirmText: isBlocking ? 'Block' : 'Unblock'
            });
            setDialogOpen(true);
        }
    };

    const confirmClientAction = async () => {
        if (!pendingAction) return;
        try {
            if (pendingAction.type === 'payout') {
                await processPayout(brokerID);
                toast.success('Payout processed successfully');
                fetchDetails(); // Reload data
            } else {
                const { deleteUser, blockUser } = await import('../../api/users.api');
                const { type, user } = pendingAction;

                if (type === 'delete') {
                    await deleteUser(user.id);
                    setClients(clients.filter(u => u.id !== user.id));
                    toast.success(`Client ${user.name} deleted successfully`);
                } else if (type === 'block') {
                    await blockUser(user.id);
                    setClients(clients.map(u => u.id === user.id ? { ...u, status: u.status === 'Blocked' ? 'Active' : 'Blocked' } : u));
                    toast.success(`Client status updated for ${user.name}`);
                }
            }
        } catch (error) {
            console.error("Action failed", error);
            toast.error("Action failed");
        } finally {
            setDialogOpen(false);
            setPendingAction(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse">
                <div className="animate-spin text-primary mb-2">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
                <span className="text-xs font-mono uppercase tracking-widest">Loading Broker Profile...</span>
            </div>
        );
    }

    if (!broker) return null;

    // Derived Stats
    const totalRevenue = commissions.reduce((sum, com) => sum + (com.amount || 0), 0);
    const totalPaid = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.amount || 0), 0);
    const payoutDue = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + (c.amount || 0), 0);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/brokers/all')}
                        className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-foreground">{broker.company || broker.name}</h1>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${broker.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {broker.status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                            ID: <span className="font-mono text-xs">{broker.brokerId}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            Joined {new Date(broker.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 text-xs">
                        <Mail size={14} /> Send Email
                    </Button>
                    <Button
                        variant="primary"
                        className="gap-2 text-xs font-bold shadow-lg shadow-primary/20"
                        onClick={() => navigate(`/brokers/edit?id=${broker.id}`)}
                    >
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Info and Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {/* Profile Card */}
                <Card className="col-span-1 p-5 bg-[#050505] border-white/5 space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold text-lg border border-white/10 uppercase">
                            {broker.name.substring(0, 2)}
                        </div>
                        <div>
                            <div className="text-sm font-bold">{broker.name}</div>
                            <div className="text-xs text-muted-foreground">Owner / Manager</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail size={14} className="shrink-0" /> {broker.email}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Phone size={14} className="shrink-0" /> {broker.phone}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <MapPin size={14} className="shrink-0" /> {broker.location || 'N/A'}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t border-white/5">
                            <Briefcase size={14} className="shrink-0 text-primary" />
                            <span className="text-foreground font-bold">
                                {broker.commission?.type === 'FIXED'
                                    ? `₹${broker.commission.value} Fixed`
                                    : `${broker.commission?.value || 0}% Commission Share`}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Stats & Revenue */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <StatCard
                        label="Total Revenue Generated"
                        value={`₹ ${totalRevenue.toLocaleString()}`}
                        icon={TrendingUp}
                        subValue="Based on commissions"
                    />
                    <StatCard
                        label="Total Clients"
                        value={clients.length}
                        icon={Users}
                        subValue="Referred Users"
                    />
                    <StatCard
                        label="Commission Paid"
                        value={`₹ ${totalPaid.toLocaleString()}`}
                        icon={DollarSign}
                        subValue="Processed payouts"
                    />
                    <StatCard
                        label="Payout Due"
                        value={`₹ ${payoutDue.toLocaleString()}`}
                        icon={Wallet}
                        highlight
                        subValue={payoutDue > 0 ? "Pending approval" : "All cleared"}
                        actionLabel={payoutDue > 0 ? "PAY NOW" : null}
                        onAction={payoutDue > 0 ? handlePayoutClick : null}
                    />
                </div>
            </div>

            {/* Clients Table Section */}
            <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Users size={14} /> Assigned Clients
                    </h3>
                </div>
                <div className="flex-1 min-h-0 relative">
                    <UserTable users={clients} onAction={handleClientAction} isLoading={false} />
                </div>
            </div>

            <ConfirmDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={confirmClientAction}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                confirmVariant={dialogConfig.variant}
            />
        </div>
    );
};

export default BrokerDetails;
