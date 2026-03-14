import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    TrendingUp,
    Users,
    DollarSign,
    Wallet,
    Upload,
    Image as ImageIcon,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import UserTable from '../../components/tables/UserTable';
import { getSubBroker, processPayout } from '../../api/subbrokers.api';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const StatCard = ({ label, value, icon, subValue, highlight, actionLabel, onAction }) => {
    const Icon = icon;

    return (
        <Card className="group relative overflow-hidden p-4">
            <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-20">
                <Icon size={48} />
            </div>
            <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Icon size={12} /> {label}
                    </div>
                    {actionLabel && onAction && (
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onAction();
                            }}
                            className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary transition-colors hover:bg-primary/20"
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
};

const formatInr = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1').replace(/\/v1\/?$/, '');
const getProofUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${apiBaseUrl}/${String(path).replace(/^\/+/, '')}`;
};

const BrokerDetails = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const brokerID = searchParams.get('id');
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [broker, setBroker] = useState(null);
    const [clients, setClients] = useState([]);
    const [commissions, setCommissions] = useState([]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({
        title: '',
        message: '',
        variant: 'primary',
        confirmText: 'Confirm',
    });

    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutFile, setPayoutFile] = useState(null);
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState(null);

    const fetchDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await getSubBroker(brokerID);
            setBroker(data.subBroker);
            setClients(data.clients || []);
            setCommissions(data.commissions || []);
        } catch (error) {
            console.error('Failed to fetch broker details', error);
            toast.error('Failed to load broker details');
        } finally {
            setIsLoading(false);
        }
    }, [brokerID, toast]);

    useEffect(() => {
        if (!brokerID) {
            navigate('/brokers/all');
            return;
        }

        fetchDetails();
    }, [brokerID, fetchDetails, navigate]);

    const resetPayoutState = () => {
        setPayoutFile(null);
        setPayoutModalOpen(false);
    };

    const handlePayoutClick = () => {
        const pendingAmount = commissions
            .filter((commission) => commission.status === 'PENDING')
            .reduce((sum, commission) => sum + (commission.amount || 0), 0);

        if (pendingAmount <= 0) return;
        setPayoutModalOpen(true);
    };

    const handleClientAction = (action, user) => {
        if (action === 'view') {
            navigate(`/users/details?id=${user.id}`);
            return;
        }

        if (action === 'edit') {
            navigate(`/users/edit?id=${user.id}`);
            return;
        }

        if (action === 'delete') {
            setPendingAction({ type: 'delete', user });
            setDialogConfig({
                title: 'Delete Client',
                message: `Are you sure you want to PERMANENTLY DELETE ${user.name}? This action cannot be undone.`,
                variant: 'danger',
                confirmText: 'Delete Client',
            });
            setDialogOpen(true);
            return;
        }

        if (action === 'block') {
            const isBlocking = user.status !== 'Blocked';
            setPendingAction({ type: 'block', user });
            setDialogConfig({
                title: isBlocking ? 'Block Client' : 'Unblock Client',
                message: `Are you sure you want to ${isBlocking ? 'BLOCK' : 'UNBLOCK'} ${user.name}?`,
                variant: isBlocking ? 'danger' : 'primary',
                confirmText: isBlocking ? 'Block' : 'Unblock',
            });
            setDialogOpen(true);
        }
    };

    const confirmClientAction = async () => {
        if (!pendingAction) return;

        try {
            const { deleteUser, blockUser } = await import('../../api/users.api');
            const { type, user } = pendingAction;

            if (type === 'delete') {
                await deleteUser(user.id);
                setClients(clients.filter((client) => client.id !== user.id));
                toast.success(`Client ${user.name} deleted successfully`);
            } else if (type === 'block') {
                await blockUser(user.id);
                setClients(
                    clients.map((client) =>
                        client.id === user.id
                            ? { ...client, status: client.status === 'Blocked' ? 'Active' : 'Blocked' }
                            : client
                    )
                );
                toast.success(`Client status updated for ${user.name}`);
            }
        } catch (error) {
            console.error('Action failed', error);
            toast.error('Action failed');
        } finally {
            setDialogOpen(false);
            setPendingAction(null);
        }
    };

    const handleProcessPayout = async () => {
        if (!payoutFile) {
            toast.error('Please upload payout screenshot proof');
            return;
        }

        try {
            setIsProcessingPayout(true);
            const formData = new FormData();
            formData.append('screenshot', payoutFile);

            await processPayout(brokerID, formData);
            toast.success('Payout marked as paid and WhatsApp proof sent');
            resetPayoutState();
            fetchDetails();
        } catch (error) {
            console.error('Payout processing failed', error);
            toast.error(error?.response?.data?.message || 'Failed to process payout');
        } finally {
            setIsProcessingPayout(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center animate-pulse text-muted-foreground">
                <div className="mb-2 animate-spin text-primary">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest">Loading Broker Profile...</span>
            </div>
        );
    }

    if (!broker) return null;

    const totalRevenue = commissions.reduce((sum, commission) => sum + (commission.amount || 0), 0);
    const totalPaid = commissions
        .filter((commission) => commission.status === 'PAID')
        .reduce((sum, commission) => sum + (commission.amount || 0), 0);
    const payoutDue = commissions
        .filter((commission) => commission.status === 'PENDING')
        .reduce((sum, commission) => sum + (commission.amount || 0), 0);
    const payoutHistory = Object.values(
        commissions
            .filter((commission) => commission.status === 'PAID')
            .reduce((accumulator, commission) => {
                const batchKey = commission.payoutBatchId || commission._id;
                if (!accumulator[batchKey]) {
                    accumulator[batchKey] = {
                        id: batchKey,
                        batchId: commission.payoutBatchId || 'Legacy payout',
                        amount: 0,
                        count: 0,
                        processedAt: commission.payoutProcessedAt || commission.updatedAt || commission.createdAt,
                        payoutProof: commission.payoutProof || '',
                    };
                }

                accumulator[batchKey].amount += Number(commission.amount || 0);
                accumulator[batchKey].count += 1;

                if (!accumulator[batchKey].payoutProof && commission.payoutProof) {
                    accumulator[batchKey].payoutProof = commission.payoutProof;
                }

                return accumulator;
            }, {})
    ).sort((first, second) => new Date(second.processedAt || 0) - new Date(first.processedAt || 0));
    const payoutHistoryRows = payoutHistory.map((payout, index) => ({
        ...payout,
        serial: index + 1,
        processedLabel: payout.processedAt
            ? new Date(payout.processedAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : 'N/A',
        proofUrl: getProofUrl(payout.payoutProof),
    }));
    const payoutHistoryColumns = [
        {
            accessorKey: 'serial',
            header: '#',
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.serial}</span>,
        },
        {
            accessorKey: 'batchId',
            header: 'Batch',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="font-semibold text-foreground">{row.original.batchId}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.count} commission{row.original.count === 1 ? '' : 's'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => <span className="font-semibold text-foreground">{formatInr(row.original.amount)}</span>,
        },
        {
            accessorKey: 'processedLabel',
            header: 'Paid On',
            cell: ({ row }) => <span className="text-foreground/80">{row.original.processedLabel}</span>,
        },
        {
            accessorKey: 'proof',
            header: 'Proof',
            cell: ({ row }) =>
                row.original.proofUrl ? (
                    <div className="flex items-center gap-3">
                        <img
                            src={row.original.proofUrl}
                            alt="Payout proof thumbnail"
                            className="h-10 w-10 rounded-lg border border-border/70 object-cover"
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">View Proof</span>
                    </div>
                ) : (
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No Proof</span>
                ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: () => (
                <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-500">
                    Paid
                </span>
            ),
        },
    ];

    return (
        <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/brokers/all')}
                        className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-foreground">{broker.company || broker.name}</h1>
                            <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    broker.status === 'Active'
                                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                                        : 'border border-red-500/20 bg-red-500/10 text-red-500'
                                }`}
                            >
                                {broker.status}
                            </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                            ID: <span className="font-mono text-xs">{broker.brokerId}</span>
                            <span className="h-1 w-1 rounded-full bg-white/20" />
                            Joined{' '}
                            {new Date(broker.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        className="gap-2 text-xs font-bold shadow-lg shadow-primary/20"
                        onClick={() => navigate(`/brokers/edit?id=${broker.id}`)}
                    >
                        Edit Profile
                    </Button>
                </div>
            </div>

            <div className="grid shrink-0 grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="col-span-1 space-y-4 p-5">
                    <div className="flex items-center gap-4 border-b border-border/70 pb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-gradient-to-br from-primary/20 to-secondary/20 text-lg font-bold uppercase text-primary">
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
                        <div className="flex items-center gap-3 border-t border-border/70 pt-2 text-sm text-muted-foreground">
                            <Briefcase size={14} className="shrink-0 text-primary" />
                            <span className="font-bold text-foreground">
                                {broker.commission?.type === 'FIXED'
                                    ? `${formatInr(broker.commission.value)} Fixed`
                                    : `${broker.commission?.value || 0}% Commission Share`}
                            </span>
                        </div>
                    </div>
                </Card>

                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <StatCard
                        label="Total Revenue Generated"
                        value={formatInr(totalRevenue)}
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
                        value={formatInr(totalPaid)}
                        icon={DollarSign}
                        subValue="Processed payouts"
                    />
                    <StatCard
                        label="Payout Due"
                        value={formatInr(payoutDue)}
                        icon={Wallet}
                        highlight
                        subValue={payoutDue > 0 ? 'Pending approval' : 'All cleared'}
                        actionLabel={payoutDue > 0 ? 'PAY NOW' : null}
                        onAction={payoutDue > 0 ? handlePayoutClick : null}
                    />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            <Wallet size={14} /> Payout History
                        </h3>
                        <div className="text-xs text-muted-foreground">
                            {payoutHistory.length} payout{payoutHistory.length === 1 ? '' : 's'} processed
                        </div>
                    </div>
                    {payoutHistory.length > 0 ? (
                        <Table
                            data={payoutHistoryRows}
                            columns={payoutHistoryColumns}
                            onRowClick={(payout) => setSelectedPayout(payout)}
                        />
                    ) : (
                        <Card className="border border-dashed border-border/70 bg-secondary/10 p-5 text-sm text-muted-foreground">
                            No payout history yet. Once a payout is marked paid, its screenshot proof will appear here.
                        </Card>
                    )}
                </div>

                <div className="flex items-center justify-between shrink-0">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        <Users size={14} /> Assigned Clients
                    </h3>
                </div>
                <div className="relative min-h-0 flex-1">
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

            {payoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm">
                    <div className="flex max-h-[calc(100vh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-border/70 bg-background shadow-2xl shadow-black/25 sm:max-h-[calc(100vh-2rem)] sm:rounded-3xl">
                        <div className="border-b border-border/70 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                                        <Wallet size={12} />
                                        Mark Payout
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                                        Upload payout proof and notify sub-broker
                                    </h3>
                                    <p className="max-w-xl text-sm text-muted-foreground">
                                        Add the payment screenshot as proof. Once saved, payout will be marked paid and the same proof will go to the sub-broker on WhatsApp.
                                    </p>
                                </div>
                                <button
                                    onClick={resetPayoutState}
                                    disabled={isProcessingPayout}
                                    className="rounded-xl border border-border/70 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                                        Sub Broker
                                    </div>
                                    <div className="mt-2 text-lg font-bold text-foreground">
                                        {broker.company || broker.name}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {broker.phone || 'No phone number added'}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary/80">
                                        Pending Amount
                                    </div>
                                    <div className="mt-2 text-3xl font-black tracking-tight text-primary">
                                        {formatInr(payoutDue)}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        This amount will be marked as paid for all pending commissions.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground">Payment screenshot proof</label>
                                <label className="group flex cursor-pointer flex-col items-start gap-4 rounded-2xl border border-dashed border-border/80 bg-secondary/20 px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                            {payoutFile ? <ImageIcon size={20} /> : <Upload size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-foreground">
                                                {payoutFile ? payoutFile.name : 'Upload screenshot proof'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                PNG, JPG, JPEG or WEBP up to 5MB. This image will be saved as the payout proof.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 rounded-xl border border-border/70 bg-background px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground group-hover:text-foreground">
                                        Choose File
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) => setPayoutFile(event.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                            <Card className="border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                                WhatsApp message will be sent automatically with payout confirmation and the uploaded screenshot proof. No manual message is required.
                            </Card>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-border/70 bg-secondary/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                            <Button
                                variant="outline"
                                onClick={resetPayoutState}
                                disabled={isProcessingPayout}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="w-full gap-2 sm:w-auto"
                                onClick={handleProcessPayout}
                                disabled={isProcessingPayout || !payoutFile}
                            >
                                {isProcessingPayout ? 'Processing...' : 'Save Proof & Mark Paid'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm">
                    <div className="flex max-h-[calc(100vh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-border/70 bg-background shadow-2xl shadow-black/25 sm:max-h-[calc(100vh-2rem)] sm:rounded-3xl">
                        <div className="border-b border-border/70 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                                    <ImageIcon size={12} />
                                    Payout Proof
                                </div>
                                <h3 className="break-words text-lg font-black tracking-tight text-foreground sm:text-xl">{selectedPayout.batchId}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatInr(selectedPayout.amount)} paid on {selectedPayout.processedLabel}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="rounded-xl border border-border/70 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                            >
                                Close
                            </button>
                        </div>
                        </div>

                        <div className="grid gap-4 overflow-y-auto px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="overflow-hidden rounded-2xl border border-border/70 bg-secondary/20 sm:rounded-3xl">
                                {selectedPayout.proofUrl ? (
                                    <img
                                        src={selectedPayout.proofUrl}
                                        alt="Payout proof full preview"
                                        className="max-h-[42vh] w-full object-contain bg-black/10 sm:max-h-[70vh]"
                                    />
                                ) : (
                                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-muted-foreground sm:min-h-[360px]">
                                        <ImageIcon size={32} />
                                        <span className="text-sm font-semibold">No screenshot proof available</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Card className="border border-border/70 bg-secondary/10 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Amount</div>
                                    <div className="mt-2 break-words text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                                        {formatInr(selectedPayout.amount)}
                                    </div>
                                </Card>
                                <Card className="border border-border/70 bg-secondary/10 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Processed At</div>
                                    <div className="mt-2 break-words text-sm font-semibold text-foreground">{selectedPayout.processedLabel}</div>
                                </Card>
                                <Card className="border border-border/70 bg-secondary/10 p-4">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Commission Count</div>
                                    <div className="mt-2 text-sm font-semibold text-foreground">
                                        {selectedPayout.count} commission{selectedPayout.count === 1 ? '' : 's'} included
                                    </div>
                                </Card>
                                {selectedPayout.proofUrl && (
                                    <a
                                        href={selectedPayout.proofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex w-full items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/15 sm:w-auto"
                                    >
                                        Open Original Screenshot
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrokerDetails;
