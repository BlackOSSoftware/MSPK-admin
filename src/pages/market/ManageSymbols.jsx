import React, { useState, useEffect } from 'react';
import { Search, Plus, BarChart2, Download, List, Settings, Sparkles, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketTable from '../../components/tables/MarketTable';
import Button from '../../components/ui/Button';
import DataFeedConfig from './DataFeedConfig';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getSymbols, deleteSymbol } from '../../api/market.api';
import useToast from '../../hooks/useToast';
import TablePageFooter from '../../components/ui/TablePageFooter';

const ManageSymbols = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('watchlist');

    // Symbols State
    const [symbols, setSymbols] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingSymbols, setLoadingSymbols] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingSymbols(true);
        try {
            const [symData] = await Promise.all([getSymbols()]);
            setSymbols(symData);
        } catch (error) {
            console.error("Failed to load market data", error);
            toast.error("Failed to load market data");
        } finally {
            setLoadingSymbols(false);
        }
    };


    const handleDeleteClick = (symbol) => {
        setDeleteModal({ isOpen: true, type: 'symbol', data: symbol });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.data) return;

        try {
            if (deleteModal.type === 'symbol') {
                await deleteSymbol(deleteModal.data._id);
                toast.success(`Deleted ${deleteModal.data.symbol} successfully`);
                loadData();
            }
            setDeleteModal({ isOpen: false, type: null, data: null });
        } catch (error) {
            console.error("Failed to delete item", error);
            const msg = error.response?.data?.message || "Failed to delete item";
            toast.error(msg);
        }
    };

    const filteredSymbols = symbols.filter(sym =>
        sym.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sym.name && sym.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalSymbols = symbols.length;
    const activeSymbols = symbols.filter(s => s.isActive).length;
    const inactiveSymbols = totalSymbols - activeSymbols;

    const toneStyles = {
        emerald: { box: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', bar: 'bg-emerald-500/70' },
        primary: { box: 'bg-primary/10 border-primary/20', text: 'text-primary', bar: 'bg-primary/70' },
        amber: { box: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', bar: 'bg-amber-500/70' },
        rose: { box: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-500', bar: 'bg-rose-500/70' },
        sky: { box: 'bg-sky-500/10 border-sky-500/20', text: 'text-sky-500', bar: 'bg-sky-500/70' }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, data: null })}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deleteModal.type === 'symbol' ? 'Symbol' : 'Segment'}?`}
                message={`Are you sure you want to delete ${deleteModal.type === 'symbol' ? deleteModal.data?.symbol : deleteModal.data?.name}? This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
            />

            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('watchlist')}
                        className={`px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${activeTab === 'watchlist'
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                    >
                        <List size={14} /> Instruments
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${activeTab === 'config'
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                    >
                        <Settings size={14} /> Data Feed Config
                    </button>
                </div>

                {activeTab === 'watchlist' && (
                    <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-3 sm:p-4">
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                                    <Sparkles size={16} className="text-primary" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Overview</p>
                                    <h2 className="text-sm sm:text-base font-bold text-foreground">Market Inventory</h2>
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
                                Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                            {[
                                { label: 'Total Symbols', value: `${totalSymbols}`, icon: BarChart2, tone: 'primary' },
                                { label: 'Active Feeds', value: `${activeSymbols}`, icon: CheckCircle, tone: 'emerald' },
                                { label: 'Inactive', value: `${inactiveSymbols}`, icon: XCircle, tone: 'rose' }
                            ].map((card) => {
                                const tone = toneStyles[card.tone] || toneStyles.primary;
                                return (
                                    <div
                                        key={card.label}
                                        className={`rounded-2xl border border-border/70 bg-card/70 p-2.5 sm:p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ${card.tone === 'primary' ? 'bg-amber-400/90 border-amber-300/60' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className={`text-[9px] uppercase tracking-wider font-semibold ${card.tone === 'primary' ? 'text-foreground/70' : 'text-muted-foreground'}`}>{card.label}</p>
                                                <p className={`text-base sm:text-lg font-bold mt-0.5 ${card.tone === 'primary' ? 'text-foreground' : 'text-foreground'}`}>{card.value}</p>
                                            </div>
                                            <div className={`h-8 w-8 rounded-lg border grid place-items-center ${card.tone === 'primary' ? 'bg-white/60 border-white/60' : tone.box}`}>
                                                <card.icon size={14} className={card.tone === 'primary' ? 'text-foreground' : tone.text} />
                                            </div>
                                        </div>
                                        <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${card.tone === 'primary' ? 'bg-foreground/10' : 'bg-secondary/50'}`}>
                                            <div className={`h-full ${card.tone === 'primary' ? 'bg-foreground/40' : tone.bar}`} style={{ width: '70%' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative flex flex-col">
                {activeTab === 'watchlist' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Toolbar */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 bg-card border border-border p-3 rounded-2xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                                        <TrendingUp size={16} className="text-primary" />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Symbols</p>
                                        <h2 className="text-sm sm:text-base font-bold text-foreground">Market Watchlist</h2>
                                    </div>
                                </div>

                                <div className="hidden sm:block h-7 w-[1px] bg-border/70" />

                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground font-medium">Total Symbols:</span>
                                    <span className="text-foreground font-bold">{symbols.length}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                                <div className="relative group w-full sm:w-64">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH INSTRUMENT..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-3 w-full text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] border-border gap-1.5 rounded-lg hover:border-primary/50 flex-1 sm:flex-none min-w-0 px-3" onClick={loadData}>
                                    <Download size={12} /> Sync
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/market/add')}
                                        className="h-8 text-[10px] gap-1.5 rounded-lg font-bold flex-1 sm:flex-none min-w-0 px-3 btn-cancel"
                                    >
                                        <Plus size={12} /> Add Symbol
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <div className="flex-1 min-h-[620px] relative">
                                <MarketTable
                                    symbols={filteredSymbols.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                                    onEdit={(sym) => navigate('/market/edit', { state: { symbol: sym } })}
                                    onDelete={handleDeleteClick}
                                    isLoading={loadingSymbols}
                                />

                                {!loadingSymbols && filteredSymbols.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                                        <BarChart2 size={48} strokeWidth={1} />
                                        <div className="text-center">
                                            <p className="text-sm font-bold uppercase tracking-widest">No Symbols Found</p>
                                            <p className="text-[10px] font-mono mt-1">Try adjusting search or add a new symbol</p>
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="shrink-0 mt-2">
                                <TablePageFooter
                                    total={filteredSymbols.length}
                                    page={currentPage}
                                    totalPages={Math.ceil(filteredSymbols.length / itemsPerPage) || 1}
                                    perPage={itemsPerPage}
                                    perPageOptions={[20, 50, 100]}
                                    onPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                    onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    onNext={() => setCurrentPage(p => Math.min(Math.ceil(filteredSymbols.length / itemsPerPage), p + 1))}
                                />
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <DataFeedConfig />
                    </div>
                )}
            </div>
        </div >
    );
};

export default ManageSymbols;
