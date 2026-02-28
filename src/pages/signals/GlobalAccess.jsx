import React from 'react';
import { Search, ToggleLeft, ToggleRight, Lock, Unlock, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const GlobalAccess = () => {
    // Mock Data: Users and their access status to different categories
    const usersAccess = [
        { id: 'MS-1001', name: 'Rajesh Kumar', plan: 'Gold', niftyOptions: true, bankNifty: true, intraday: true, commodity: false },
        { id: 'MS-1002', name: 'Amit Singh', plan: 'Silver', niftyOptions: true, bankNifty: false, intraday: false, commodity: false },
        { id: 'MS-1003', name: 'Sneha Gupta', plan: 'Platinum', niftyOptions: true, bankNifty: true, intraday: true, commodity: true },
        { id: 'MS-1004', name: 'Vikram Malhotra', plan: 'Demo', niftyOptions: false, bankNifty: false, intraday: false, commodity: false },
    ];

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Usage & Access Control</h1>
                    <p className="text-muted-foreground text-sm">Manage signal access permissions for all users globally</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search User..."
                            className="bg-secondary/30 border border-white/5 h-8 pl-3 pr-3 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            <Card className="flex-1 bg-[#050505] border-white/5 overflow-hidden" noPadding>
                <div className="overflow-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground sticky top-0">
                            <tr>
                                <th className="p-4 border-b border-white/5">User</th>
                                <th className="p-4 border-b border-white/5">Current Plan</th>
                                <th className="p-4 border-b border-white/5 text-center">Nifty 50</th>
                                <th className="p-4 border-b border-white/5 text-center">BankNifty</th>
                                <th className="p-4 border-b border-white/5 text-center">Intraday</th>
                                <th className="p-4 border-b border-white/5 text-center">Commodity</th>
                                <th className="p-4 border-b border-white/5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {usersAccess.map((user, index) => (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{user.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold uppercase tracking-wider">
                                            {user.plan}
                                        </span>
                                    </td>
                                    {/* Access Toggles */}
                                    {[user.niftyOptions, user.bankNifty, user.intraday, user.commodity].map((access, i) => (
                                        <td key={i} className="p-4 text-center">
                                            <button className={`transition-colors ${access ? 'text-emerald-500 hover:text-emerald-400' : 'text-muted-foreground hover:text-white'}`}>
                                                {access ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                            </button>
                                        </td>
                                    ))}
                                    <td className="p-4 text-center">
                                        <Button variant="ghost" size="sm" className="text-xs h-7 border-white/10 hover:bg-white/5">
                                            Manage
                                        </Button>
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

export default GlobalAccess;
