import React from 'react';
import { History, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const SubscriptionHistory = ({ isEmbedded = false, data = [] }) => {
    // Fallback or Empty state handled in rendering
    const history = data.length > 0 ? data : [];


    return (
        <div className={`space-y-6 h-full flex flex-col ${isEmbedded ? 'pt-2' : ''}`}>
            {!isEmbedded && (
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Subscription History</h1>
                        <p className="text-muted-foreground text-sm">Track user plan purchases and renewals</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download size={14} /> Export Report
                    </Button>
                </div>
            )}

            <Card className="flex-1 bg-[#050505] border-white/5 overflow-hidden" noPadding>
                <div className="overflow-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground sticky top-0">
                            <tr>
                                <th className="p-4 border-b border-white/5">Subscription ID</th>
                                <th className="p-4 border-b border-white/5">Plan Name</th>
                                <th className="p-4 border-b border-white/5">Amount</th>
                                <th className="p-4 border-b border-white/5">Purchase Date</th>
                                <th className="p-4 border-b border-white/5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {history.map((item, index) => (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-mono text-muted-foreground">{item.id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4 font-medium text-foreground">{item.plan}</td>
                                    <td className="p-4 text-foreground font-mono">{item.amount}</td>
                                    <td className="p-4 text-muted-foreground">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${item.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SubscriptionHistory;
