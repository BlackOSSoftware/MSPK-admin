import React, { useState, useEffect } from 'react';
import { Search, Plus, BarChart2, Download, List, Settings, Layers, Save, X, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketTable from '../../components/tables/MarketTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { clsx } from 'clsx';
import DataFeedConfig from './DataFeedConfig';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getSymbols, getSegments, createSegment, updateSegment, deleteSegment, deleteSymbol } from '../../api/market.api';
import useToast from '../../hooks/useToast';

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

    // Segments State
    const [segments, setSegments] = useState([]);
    const [newSegment, setNewSegment] = useState({ name: '', code: '' });
    const [loadingSegments, setLoadingSegments] = useState(false);
    const [creatingSegment, setCreatingSegment] = useState(false);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingSymbols(true);
        setLoadingSegments(true);
        try {
            const [symData, segData] = await Promise.all([getSymbols(), getSegments()]);
            setSymbols(symData);
            setSegments(segData);
        } catch (error) {
            console.error("Failed to load market data", error);
            toast.error("Failed to load market data");
        } finally {
            setLoadingSymbols(false);
            setLoadingSegments(false);
        }
    };

    const handleSaveSegment = async (e) => {
        e.preventDefault();
        if (!newSegment.name || !newSegment.code) {
            toast.error("Name and Code are required");
            return;
        }
        setCreatingSegment(true);
        try {
            if (newSegment._id) {
                await updateSegment(newSegment._id, { name: newSegment.name, code: newSegment.code });
                toast.success("Segment updated successfully");
            } else {
                await createSegment(newSegment);
                toast.success("Segment created successfully");
            }
            setNewSegment({ name: '', code: '' });
            // Reload segments
            const updatedSegments = await getSegments();
            setSegments(updatedSegments);
        } catch (error) {
            console.error("Failed to save segment", error);
            toast.error("Failed to save segment");
        } finally {
            setCreatingSegment(false);
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
            } else if (deleteModal.type === 'segment') {
                await deleteSegment(deleteModal.data._id);
                toast.success(`Deleted ${deleteModal.data.name} successfully`);
                const updatedSegments = await getSegments();
                setSegments(updatedSegments);
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
                <div className="flex items-center gap-1 border-b border-border">
                    <button
                        onClick={() => setActiveTab('watchlist')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'watchlist'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <List size={14} /> Instruments
                    </button>
                    <button
                        onClick={() => setActiveTab('segments')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'segments'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Layers size={14} /> Segments
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'config'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Settings size={14} /> Data Feed Config
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 relative flex flex-col">
                {activeTab === 'watchlist' && (
                    <div className="flex flex-col h-full gap-2">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between shrink-0 bg-card border border-border p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                    <BarChart2 size={16} className="text-primary" />
                                    Market Watchlist
                                </h2>

                                <div className="h-6 w-[1px] bg-white/10"></div>

                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground font-medium">Total Symbols:</span>
                                    <span className="text-foreground font-bold">{symbols.length}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        type="text"
                                        placeholder="SEARCH INSTRUMENT..."
                                        className="bg-secondary/30 border border-border h-8 pl-9 pr-3 w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="h-8 text-[11px] border-border gap-1.5 rounded-lg hover:border-primary/50" onClick={loadData}>
                                    <Download size={12} /> Sync
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate('/market/add')}
                                    className="h-8 text-[11px] gap-1.5 rounded-lg font-bold shadow-lg shadow-primary/20"
                                >
                                    <Plus size={12} /> Add Symbol
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <div className="flex-1 min-h-0 relative">
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

                            {/* Footer Stats & Pagination */}
                            <div className="h-9 bg-muted/30 border border-border rounded-lg flex items-center justify-between px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 mt-2 shrink-0">
                                <div className="flex items-center gap-4">
                                    <span>
                                        {filteredSymbols.length > 0 ? (
                                            <>Showing <span className="text-foreground font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSymbols.length)}</span> of <span className="text-foreground font-bold">{filteredSymbols.length}</span></>
                                        ) : (
                                            <span className="text-muted-foreground">No symbols found</span>
                                        )}
                                    </span>
                                    <span className="text-muted-foreground/50">|</span>
                                    <div className="flex items-center gap-2">
                                        <span>Show:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-card text-foreground font-bold border-b border-border focus:outline-none focus:border-primary cursor-pointer pb-0.5 rounded px-1"
                                        >
                                            <option value={20} className="bg-card text-foreground">20</option>
                                            <option value={50} className="bg-card text-foreground">50</option>
                                            <option value={100} className="bg-card text-foreground">100</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Pagination Controls */}
                                    <div className="flex items-center gap-2">
                                        <span className="mr-2">Page {currentPage} of {Math.ceil(filteredSymbols.length / itemsPerPage) || 1}</span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSymbols.length / itemsPerPage), p + 1))}
                                            disabled={currentPage >= Math.ceil(filteredSymbols.length / itemsPerPage)}
                                            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'segments' && (
                    <div className="flex flex-col h-full gap-6 p-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Add Segment Form */}
                            <Card className="p-6 h-fit space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Plus size={18} className="text-primary" /> {newSegment._id ? 'Edit Segment' : 'Add New Segment'}
                                    </h3>
                                    {newSegment._id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNewSegment({ name: '', code: '' })}
                                            className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                                <form onSubmit={handleSaveSegment} className="space-y-4">
                                    <Input
                                        label="Segment Name"
                                        placeholder="e.g. Crypto Futures"
                                        value={newSegment.name}
                                        onChange={e => setNewSegment({ ...newSegment, name: e.target.value })}
                                    />
                                    <Input
                                        label="Segment Code"
                                        placeholder="e.g. CRYPTO"
                                        value={newSegment.code}
                                        onChange={e => setNewSegment({ ...newSegment, code: e.target.value.toUpperCase() })}
                                        className="uppercase font-mono"
                                        disabled={!!newSegment._id} // Disable code editing if needed, or allow it. Usually IDs are immutable but codes can be updated if refs handle it. Backend supports update.
                                    />
                                    <Button type="submit" variant="primary" className="w-full gap-2" disabled={creatingSegment}>
                                        {creatingSegment ? 'Saving...' : <><Save size={16} /> {newSegment._id ? 'Update Segment' : 'Create Segment'}</>}
                                    </Button>
                                </form>
                            </Card>

                            {/* Segments List */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Layers size={18} className="text-primary" /> Active Segments
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {segments.map(seg => (
                                        <div key={seg._id} className="bg-card border border-border p-4 rounded-lg flex items-center justify-between group hover:border-primary/50 transition-all">
                                            <div>
                                                <h4 className="font-bold text-foreground">{seg.name}</h4>
                                                <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{seg.code}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setNewSegment({ name: seg.name, code: seg.code, _id: seg._id });
                                                        setCreatingSegment(false); // Reset loading state just in case
                                                    }}
                                                    className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                                    title="Edit Segment"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, type: 'segment', data: seg })}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Segment"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {segments.length === 0 && !loadingSegments && (
                                        <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                                            No segments found. Add one to get started.
                                        </div>
                                    )}
                                </div>
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
