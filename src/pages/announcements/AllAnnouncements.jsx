import React, { useState, useEffect } from 'react';
import { Search, Plus, Megaphone, Download, Radio, Calendar, History, Trash2, Edit, Activity, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AnnouncementTable from '../../components/tables/AnnouncementTable';
import Button from '../../components/ui/Button';
import { clsx } from 'clsx';
import { fetchAnnouncements, deleteAnnouncement, exportAnnouncements } from '../../api/announcements.api';
import useToast from '../../hooks/useToast';
import SearchableSelect from '../../components/ui/SearchableSelect';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AnnouncementDetailsDialog from './AnnouncementDetailsDialog';
import TablePageFooter from '../../components/ui/TablePageFooter';

const AllAnnouncements = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();

    // State
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [activeTab, setActiveTab] = useState('active'); // active, scheduled, history
    const [selectedType, setSelectedType] = useState('All'); // New Filter
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ title: '', message: '', variant: 'primary', confirmText: 'Confirm' });
    const [viewItem, setViewItem] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const loadAnnouncements = async () => {
        setIsLoading(true);
        try {
            const params = {
                status: activeTab,
                page: currentPage,
                limit: itemsPerPage
            };
            if (selectedType !== 'All') params.type = selectedType;

            const response = await fetchAnnouncements(params);
            const { results, totalResults: total, totalPages: pages } = response.data;

            setAnnouncements(results || response.data);
            setTotalResults(total || (response.data.length || 0));
            setTotalPages(pages || 1);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const sTerm = searchParams.get('search');
        if (sTerm) setSearchTerm(sTerm);
    }, [searchParams]);

    useEffect(() => {
        loadAnnouncements();
    }, [activeTab, selectedType, currentPage, itemsPerPage]);

    const handleAction = (action, item) => {
        if (action === 'view') {
            setViewItem(item);
        } else if (action === 'edit') {
            // Production Level Check: If this is a critical alert type that isn't just scheduled in the future
            if (['SIGNAL', 'ECONOMIC', 'URGENT'].includes(item.type) && item.status !== 'Scheduled') {
                // Use a soft confirm for edit navigation first
                if (!window.confirm("⚠️ WARNING: This high-priority alert may have already been pushed to users. Editing content might create inconsistency. Proceed?")) {
                    return;
                }
            }
            navigate(`/announcements/edit/${item.id}`);
        } else if (action === 'delete') {
            setPendingAction({ type: 'delete', item });

            // Production Level Warning: Inform admin about push notification implication
            const isHighImpact = ['SIGNAL', 'ECONOMIC', 'URGENT'].includes(item.type);
            // Rough check if it's past start date (already sent)
            const isSent = item.status !== 'Scheduled';

            let message = `Are you sure you want to delete "${item.title}"?`;
            let subMessage = "This action cannot be undone.";

            if (isHighImpact && isSent) {
                subMessage = "⚠️ CRITICAL: This alert has likely already been PUSHED to devices. Deleting it here won't retract the notification.";
            }

            setDialogConfig({
                title: 'Delete Announcement',
                message: `${message} ${subMessage}`,
                variant: 'danger',
                confirmText: 'Delete Permanently'
            });
            setDialogOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'delete') {
                await deleteAnnouncement(pendingAction.item.id);
                toast.success('Announcement deleted successfully');
                loadAnnouncements();
            }
            setDialogOpen(false);
        } catch (error) {
            console.error('Action failed:', error);
            toast.error('Failed to perform action');
            setDialogOpen(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = { status: activeTab };
            if (selectedType !== 'All') params.type = selectedType;
            // params.search = searchTerm; // Pass if backend supports it

            await exportAnnouncements(params);
            toast.success('Export downloaded successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export announcements');
        } finally {
            setIsExporting(false);
        }
    };

    // Filter Logic (Local search for current page content for speed, or reload on large sets)
    const filteredData = announcements.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // No longer need local navigation slicing since backend does it
    const currentItems = filteredData;

    // Reset page when tab/type changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedType]);

    return (
        <div className="h-full flex flex-col gap-2">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-2 shrink-0">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-border mb-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'active'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Radio size={14} /> Active
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'scheduled'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <Calendar size={14} /> Scheduled
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            "px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2",
                            activeTab === 'history'
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <History size={14} /> History
                    </button>
                </div>
            </div>

            {/* Toolbar - Standardized Design */}
            <div className="shrink-0 bg-card border border-white/5 p-3 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section: Title & Stats */}
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2 shrink-0">
                        <Megaphone size={16} className="text-primary" />
                        Broadcast Center
                    </h2>
                    <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground font-medium">Type:</span>
                        <div className="w-40">
                            <SearchableSelect
                                value={selectedType}
                                onChange={setSelectedType}
                                options={[
                                    { value: 'All', label: 'ALL TYPES' },
                                    { value: 'NEWS', label: 'NEWS' },
                                    { value: 'ECONOMIC', label: 'ECONOMIC ALERT' },
                                    { value: 'SIGNAL', label: 'SIGNAL ALERT' },
                                    { value: 'URGENT', label: 'URGENT' },
                                    { value: 'REMINDER', label: 'PLAN REMINDER' }
                                ]}
                                searchable={false}
                                buttonClassName="py-1.5 text-[10px] rounded"
                                placeholder="Select Type"
                            />
                        </div>
                    </div>

                    <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>
                </div>

                {/* Right Section: Search & Actions */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            type="text"
                            placeholder="SEARCH CURRENT PAGE..."
                            className="bg-secondary/30 border border-white/5 h-8 pl-9 pr-7 w-full md:w-56 text-[11px] font-mono rounded-lg focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground/50"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-all"
                            >
                                <XCircle size={12} className="opacity-50 hover:opacity-100" />
                            </button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="h-8 text-[11px] border-border gap-1.5 rounded-lg hover:border-primary/50"
                    >
                        {isExporting ? <Activity size={12} className="animate-spin" /> : <Download size={12} />}
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/announcements/create')}
                        className="h-8 text-[11px] gap-1.5 rounded-lg font-bold btn-cancel"
                    >
                        <Plus size={12} /> New Broadcast
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 relative flex flex-col">
                <AnnouncementTable
                    announcements={currentItems}
                    onAction={handleAction}
                    isLoading={isLoading}
                    highlightTerm={searchTerm}
                />

                {!isLoading && announcements.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 bg-card/80 backdrop-blur-sm pointer-events-none">
                        <Megaphone size={48} strokeWidth={1} />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest">No Broadcasts Found</p>
                            <p className="text-[10px] font-mono mt-1">Try adjusting filters or add a new broadcast</p>
                        </div>
                    </div>
                )}
            </div>

            <TablePageFooter
                total={totalResults}
                overallTotal={totalResults}
                page={currentPage}
                totalPages={totalPages}
                perPage={itemsPerPage}
                onPerPageChange={setItemsPerPage}
                onPrev={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                onNext={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            />



            <ConfirmDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={confirmAction}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                confirmVariant={dialogConfig.variant}
            />

            <AnnouncementDetailsDialog
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                announcement={viewItem}
            />
        </div>
    );
};

export default AllAnnouncements;
