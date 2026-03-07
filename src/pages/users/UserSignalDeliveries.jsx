import React, { useEffect, useState } from 'react';
import {
    Activity,
    BadgeCheck,
    Bell,
    Clock,
    Eye,
    EyeOff,
    Radio,
    RefreshCw,
    ShieldAlert,
    Target,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TableHeaderCell from '../../components/ui/TableHeaderCell';
import TablePageFooter from '../../components/ui/TablePageFooter';
import useToast from '../../hooks/useToast';

const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '---';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    return numeric.toFixed(2);
};

const formatDateTime = (value) => {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';
    return date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getSignalStatusTone = (status) => {
    if (status === 'Active') return 'bg-primary/10 text-primary border-primary/20';
    if (status === 'Target Hit') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (status === 'Partial Profit Book') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (status === 'Stoploss Hit') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (status === 'Closed') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-secondary/30 text-muted-foreground border-border/70';
};

const UserSignalDeliveries = ({ userId, isEmbedded = false }) => {
    const toast = useToast();
    const [deliveries, setDeliveries] = useState([]);
    const [stats, setStats] = useState({
        totalDeliveries: 0,
        unreadDeliveries: 0,
        readDeliveries: 0,
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 0,
    });
    const [loading, setLoading] = useState(true);

    const loadDeliveries = async (page = 1, limit = pagination.limit) => {
        if (!userId) return;

        setLoading(true);
        try {
            const { fetchUserSignalDeliveries } = await import('../../api/users.api');
            const { data } = await fetchUserSignalDeliveries(userId, { page, limit });

            setDeliveries(Array.isArray(data?.results) ? data.results : []);
            if (data?.stats) {
                setStats((prev) => ({ ...prev, ...data.stats }));
            }
            if (data?.pagination) {
                setPagination((prev) => ({ ...prev, ...data.pagination }));
            } else {
                setPagination((prev) => ({
                    ...prev,
                    page,
                    limit,
                    totalPages: 1,
                    totalResults: Array.isArray(data?.results) ? data.results.length : 0,
                }));
            }
        } catch (error) {
            console.error('Failed to load signal deliveries', error);
            toast.error('Failed to load signal delivery history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeliveries(1, pagination.limit);
    }, [userId, pagination.limit]);

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages) return;
        loadDeliveries(nextPage, pagination.limit);
    };

    return (
        <div className={`space-y-6 h-full flex flex-col ${isEmbedded ? 'pt-2' : ''}`}>
            {!isEmbedded && (
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Signal Deliveries</h1>
                        <p className="text-muted-foreground text-sm">Track exactly which signal notifications were recorded for this user</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => loadDeliveries(pagination.page, pagination.limit)}>
                        <RefreshCw size={14} /> Refresh
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <Card className="bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="text-primary" size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Deliveries</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.totalDeliveries}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Logged from in-app signal notification records</div>
                </Card>

                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Eye className="text-emerald-500" size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Read</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.readDeliveries}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Signals the user has already opened in-app</div>
                </Card>

                <Card className="bg-amber-500/5 border-amber-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <EyeOff className="text-amber-500" size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unread</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.unreadDeliveries}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Signals still pending user acknowledgement</div>
                </Card>
            </div>

            <Card className="flex-1 overflow-hidden" noPadding>
                <div className="overflow-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground sticky top-0 z-10">
                            <tr>
                                <TableHeaderCell className="p-4 border-b border-border/70" icon={Activity} label="Signal" />
                                <TableHeaderCell className="p-4 border-b border-border/70" icon={Bell} label="Delivery Record" />
                                <TableHeaderCell className="p-4 border-b border-border/70" icon={Target} label="Entry / Targets" />
                                <TableHeaderCell className="p-4 border-b border-border/70" icon={ShieldAlert} label="Status / Outcome" />
                                <TableHeaderCell className="p-4 border-b border-border/70" icon={Clock} label="Timeline" />
                                <TableHeaderCell className="p-4 border-b border-border/70" icon={BadgeCheck} label="Read State" />
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                [...Array(6)].map((_, index) => (
                                    <tr key={`delivery-skeleton-${index}`} className="border-b border-border/60 animate-pulse">
                                        <td className="p-4"><div className="h-4 w-36 bg-muted/50 rounded mb-2" /><div className="h-3 w-48 bg-muted/50 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-44 bg-muted/50 rounded mb-2" /><div className="h-3 w-56 bg-muted/50 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-28 bg-muted/50 rounded mb-2" /><div className="h-3 w-36 bg-muted/50 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-24 bg-muted/50 rounded mb-2" /><div className="h-3 w-20 bg-muted/50 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-32 bg-muted/50 rounded mb-2" /><div className="h-3 w-28 bg-muted/50 rounded" /></td>
                                        <td className="p-4"><div className="h-5 w-16 bg-muted/50 rounded" /></td>
                                    </tr>
                                ))
                            ) : deliveries.length > 0 ? (
                                deliveries.map((item) => {
                                    const signal = item.signal;
                                    const target1 = signal?.targets?.target1;
                                    const target2 = signal?.targets?.target2;
                                    const target3 = signal?.targets?.target3;

                                    return (
                                        <tr key={item.id} className="border-b border-border/60 hover:bg-secondary/30 dark:hover:bg-white/[0.02] transition-colors align-top">
                                            <td className="p-4 min-w-[240px]">
                                                {signal ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-base font-bold text-foreground">{signal.symbol}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${signal.type === 'BUY'
                                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                                }`}>
                                                                {signal.type}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-border/70 bg-secondary/30 text-muted-foreground">
                                                                {signal.segment}
                                                            </span>
                                                            {signal.timeframe ? (
                                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-border/70 bg-secondary/30 text-muted-foreground">
                                                                    {signal.timeframe}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <div><span className="font-bold text-foreground/80">UID:</span> {signal.uniqueId || '---'}</div>
                                                            <div><span className="font-bold text-foreground/80">Webhook:</span> {signal.webhookId || '---'}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-foreground">Signal record unavailable</div>
                                                        <div className="text-xs text-muted-foreground">Notification exists but linked signal was not found.</div>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 min-w-[260px]">
                                                <div className="space-y-2">
                                                    <div className="font-semibold text-foreground">{item.title}</div>
                                                    <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words leading-5">
                                                        {item.message}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4 min-w-[220px]">
                                                {signal ? (
                                                    <div className="space-y-1 text-xs">
                                                        <div><span className="font-bold text-foreground/80">Entry:</span> <span className="font-mono text-foreground">{formatPrice(signal.entry)}</span></div>
                                                        <div><span className="font-bold text-foreground/80">TP1:</span> <span className="font-mono text-emerald-500">{formatPrice(target1)}</span></div>
                                                        <div><span className="font-bold text-foreground/80">TP2:</span> <span className="font-mono text-emerald-500">{formatPrice(target2)}</span></div>
                                                        <div><span className="font-bold text-foreground/80">TP3:</span> <span className="font-mono text-emerald-500">{formatPrice(target3)}</span></div>
                                                        <div><span className="font-bold text-foreground/80">SL:</span> <span className="font-mono text-red-500">{formatPrice(signal.stoploss)}</span></div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No signal snapshot</span>
                                                )}
                                            </td>

                                            <td className="p-4 min-w-[180px]">
                                                {signal ? (
                                                    <div className="space-y-2">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getSignalStatusTone(signal.status)}`}>
                                                            {signal.status}
                                                        </span>
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <div><span className="font-bold text-foreground/80">Exit:</span> {formatPrice(signal.exitPrice)}</div>
                                                            <div><span className="font-bold text-foreground/80">Points:</span> {signal.totalPoints ?? '---'}</div>
                                                            <div><span className="font-bold text-foreground/80">Reason:</span> {signal.exitReason || '---'}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Unknown</span>
                                                )}
                                            </td>

                                            <td className="p-4 min-w-[210px]">
                                                <div className="space-y-2 text-xs">
                                                    <div>
                                                        <div className="font-bold uppercase tracking-wider text-muted-foreground">Signal Time</div>
                                                        <div className="text-foreground">{formatDateTime(signal?.signalTime || signal?.createdAt)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold uppercase tracking-wider text-muted-foreground">Delivered At</div>
                                                        <div className="text-foreground">{formatDateTime(item.notifiedAt)}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4 min-w-[120px]">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${item.isRead
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    {item.isRead ? 'Read' : 'Unread'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Bell size={32} className="opacity-50" />
                                            <div>
                                                <p className="text-sm font-bold uppercase tracking-widest">No signal deliveries found</p>
                                                <p className="text-xs mt-1">This user does not have any logged signal notifications yet.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <TablePageFooter
                    total={pagination.totalResults}
                    overallTotal={stats.totalDeliveries}
                    page={pagination.page}
                    totalPages={pagination.totalPages || 1}
                    perPage={pagination.limit}
                    perPageOptions={[10, 20, 50]}
                    onPerPageChange={(value) => setPagination((prev) => ({ ...prev, limit: Number(value), page: 1 }))}
                    onPrev={() => handlePageChange(pagination.page - 1)}
                    onNext={() => handlePageChange(pagination.page + 1)}
                    rightExtra={
                        <div className="hidden md:flex items-center gap-2">
                            <span>Read: <span className="text-emerald-500 font-bold">{stats.readDeliveries}</span></span>
                            <span className="text-muted-foreground/40">|</span>
                            <span>Unread: <span className="text-amber-500 font-bold">{stats.unreadDeliveries}</span></span>
                        </div>
                    }
                    className="m-3 mt-0"
                />
            </Card>
        </div>
    );
};

export default UserSignalDeliveries;
