import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Sparkles,
  CreditCard,
  Globe,
  LayoutDashboard,
  CheckCircle,
  Clock3,
  XCircle,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import Button from '../../components/ui/Button';
import TablePageFooter from '../../components/ui/TablePageFooter';
import { fetchPlanEnquiries, updatePlanEnquiryStatus } from '../../api/planEnquiries.api';

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();
const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PlanEnquiries = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    reviewed: 0,
    closed: 0,
    dashboard: 0,
    publicWebsite: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [actionLoadingId, setActionLoadingId] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPlanEnquiries();
        setItems(data.results || []);
        setStats(data.stats || {});
      } catch (error) {
        console.error('Failed to load plan enquiries', error);
        toast.error('Failed to load plan enquiries');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (activeTab === 'new') return normalizeStatus(item.status) === 'new';
        if (activeTab === 'reviewed') return normalizeStatus(item.status) === 'reviewed';
        if (activeTab === 'closed') return normalizeStatus(item.status) === 'closed';
        return true;
      })
      .filter((item) => {
        if (sourceFilter === 'dashboard') return item.source === 'dashboard';
        if (sourceFilter === 'public_website') return item.source === 'public_website';
        return true;
      })
      .filter((item) => {
        const haystack = [
          item.planName,
          item.planPriceLabel,
          item.planDurationLabel,
          item.planSegment,
          item.userName,
          item.userEmail,
          item.userPhone,
          item.clientId,
          item.source,
          item.sourcePage,
          item.pageUrl,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(searchTerm.toLowerCase());
      });
  }, [activeTab, items, searchTerm, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, sourceFilter, itemsPerPage]);

  const handleStatusUpdate = async (item, status) => {
    setActionLoadingId(item._id);
    try {
      const updated = await updatePlanEnquiryStatus(item._id, { status });
      setItems((prev) => prev.map((entry) => (entry._id === item._id ? { ...entry, ...updated } : entry)));
      if (selectedItem?._id === item._id) {
        setSelectedItem((prev) => ({ ...prev, ...updated }));
      }
      toast.success(`Plan enquiry marked ${status}`);
    } catch (error) {
      console.error('Failed to update plan enquiry', error);
      toast.error('Failed to update plan enquiry');
    } finally {
      setActionLoadingId('');
    }
  };

  const getSourceBadge = (item) => (
    item.source === 'dashboard'
      ? { label: 'Dashboard', tone: 'border-sky-500/20 bg-sky-500/10 text-sky-500', icon: LayoutDashboard }
      : { label: 'Public Website', tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500', icon: Globe }
  );

  const getStatusBadge = (status) => {
    if (status === 'reviewed') return 'border-amber-500/20 bg-amber-500/10 text-amber-500';
    if (status === 'closed') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500';
    return 'border-primary/20 bg-primary/10 text-primary';
  };

  return (
    <div className="flex h-full flex-col gap-4 px-2 pb-4 sm:px-0">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="relative rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/95 to-primary/5 p-3 sm:p-4">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/10 pointer-events-none" />
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-primary/20 bg-primary/10">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">Overview</p>
              <h2 className="text-sm sm:text-base font-bold text-foreground">Plan Enquiry Pipeline</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-6 sm:gap-3">
            {[
              { label: 'Total', value: stats.total || 0, icon: CreditCard },
              { label: 'New', value: stats.new || 0, icon: Clock3 },
              { label: 'Reviewed', value: stats.reviewed || 0, icon: CheckCircle },
              { label: 'Closed', value: stats.closed || 0, icon: XCircle },
              { label: 'Dashboard', value: stats.dashboard || 0, icon: LayoutDashboard },
              { label: 'Website', value: stats.publicWebsite || 0, icon: Globe },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-border/70 bg-card/60 p-2.5 sm:p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{card.label}</p>
                    <p className="mt-0.5 text-base sm:text-lg font-bold text-foreground">{card.value}</p>
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-lg border border-primary/20 bg-primary/10">
                    <card.icon size={14} className="text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {[
                ['all', `All (${items.length})`],
                ['new', `New (${stats.new || 0})`],
                ['reviewed', `Reviewed (${stats.reviewed || 0})`],
                ['closed', `Closed (${stats.closed || 0})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={clsx(
                    'rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                    activeTab === value
                      ? 'border-primary/25 bg-primary/10 text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/20 hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 min-[420px]:flex-row">
              <div className="flex rounded-lg border border-border/70 bg-secondary/20 p-1">
                {[
                  ['all', 'All Sources'],
                  ['dashboard', 'Dashboard'],
                  ['public_website', 'Website'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSourceFilter(value)}
                    className={clsx(
                      'rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                      sourceFilter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-0 w-full min-[420px]:w-72">
                <Search className="absolute left-3 top-2 text-muted-foreground" size={12} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="text"
                  placeholder="SEARCH PLAN / USER / EMAIL..."
                  className="h-8 w-full rounded-lg border border-white/5 bg-secondary/30 pl-9 pr-3 text-[11px] font-mono focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-border/70 bg-card/70 p-3">
              <div className="h-4 w-40 rounded bg-muted/40" />
              <div className="mt-3 h-3 w-full rounded bg-muted/30" />
              <div className="mt-2 h-3 w-4/5 rounded bg-muted/30" />
            </div>
          ))
        ) : (
          paginatedItems.map((item) => {
            const sourceBadge = getSourceBadge(item);
            const SourceIcon = sourceBadge.icon;
            return (
              <div key={item._id} className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.planName || '-'}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{item.planPriceLabel || '-'} / {item.planDurationLabel || '-'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${getStatusBadge(item.status)}`}>
                    {item.status || 'new'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider">User</div>
                    <div className="mt-1 text-foreground">{item.userName || 'Website Visitor'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider">Time</div>
                    <div className="mt-1 text-foreground">{formatDateTime(item.createdAt)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[9px] uppercase tracking-wider">Email</div>
                    <div className="mt-1 break-all text-foreground">{item.userEmail || 'Unavailable'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider">Phone</div>
                    <div className="mt-1 text-foreground">{item.userPhone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider">Client ID</div>
                    <div className="mt-1 text-foreground">{item.clientId || '-'}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${sourceBadge.tone}`}>
                    <SourceIcon size={10} />
                    {sourceBadge.label}
                  </span>
                  <span className="inline-flex rounded-full border border-border/70 bg-muted/20 px-2 py-1 text-[9px] font-bold uppercase text-muted-foreground">
                    {item.sourcePage || 'Unknown source'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setSelectedItem(item)}>View Details</Button>
                  <Button size="sm" variant="outline" className="text-[10px]" disabled={actionLoadingId === item._id} onClick={() => handleStatusUpdate(item, 'reviewed')}>Reviewed</Button>
                  <Button size="sm" variant="secondary" className="text-[10px]" disabled={actionLoadingId === item._id} onClick={() => handleStatusUpdate(item, 'closed')}>Close</Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden min-h-0 flex-1 md:block">
        <div className="h-full overflow-auto rounded-2xl border border-border/70 bg-card">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/70">
              <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3 font-bold">Plan</th>
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-4 py-3 font-bold">User Details</th>
                <th className="px-4 py-3 font-bold">Enquiry Details</th>
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 text-sm">
              {isLoading ? (
                [...Array(8)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-muted/30" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-muted/30" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-44 rounded bg-muted/30" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-muted/30" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-36 rounded bg-muted/30" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-muted/30" /></td>
                    <td className="px-4 py-4"><div className="ml-auto h-8 w-40 rounded bg-muted/30" /></td>
                  </tr>
                ))
              ) : (
                paginatedItems.map((item) => {
                  const sourceBadge = getSourceBadge(item);
                  const SourceIcon = sourceBadge.icon;
                  return (
                    <tr key={item._id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-4 align-top">
                        <div className="min-w-0">
                          <div className="font-bold text-foreground">{item.planName || '-'}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{item.planPriceLabel || '-'} / {item.planDurationLabel || '-'}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{item.planSegment || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${sourceBadge.tone}`}>
                            <SourceIcon size={11} />
                            {sourceBadge.label}
                          </span>
                          <div className="text-xs text-muted-foreground">{item.sourcePage || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold text-foreground">{item.userName || 'Website Visitor'}</div>
                          <div className="text-muted-foreground break-all">{item.userEmail || 'No email available'}</div>
                          <div className="text-muted-foreground">{item.userPhone || '-'}</div>
                          <div className="font-mono text-muted-foreground">{item.clientId || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="font-semibold text-foreground">{item.sourcePage || '-'}</div>
                          <div className="break-all">{item.pageUrl || '-'}</div>
                          <div>{item.ipAddress || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                        <div>{formatDateTime(item.createdAt)}</div>
                        <div className="mt-1">Reviewed: {formatDateTime(item.reviewedAt)}</div>
                        <div className="mt-1">Closed: {formatDateTime(item.closedAt)}</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadge(item.status)}`}>
                          {item.status || 'new'}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setSelectedItem(item)}>View</Button>
                          <Button size="sm" variant="outline" className="text-[10px]" disabled={actionLoadingId === item._id} onClick={() => handleStatusUpdate(item, 'reviewed')}>Reviewed</Button>
                          <Button size="sm" variant="secondary" className="text-[10px]" disabled={actionLoadingId === item._id} onClick={() => handleStatusUpdate(item, 'closed')}>Close</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePageFooter
        total={filteredItems.length}
        overallTotal={items.length}
        page={currentPage}
        totalPages={totalPages}
        perPage={itemsPerPage}
        onPerPageChange={setItemsPerPage}
        onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      />

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-border/70 bg-card shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 p-4 sm:p-6">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Plan Enquiry Details</div>
                <div className="mt-2 text-lg font-black text-foreground break-words">{selectedItem.planName}</div>
                <div className="mt-1 text-sm text-muted-foreground">{selectedItem.planPriceLabel || '-'} / {selectedItem.planDurationLabel || '-'}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
              {[
                { label: 'User Name', value: selectedItem.userName || 'Website Visitor', icon: User },
                { label: 'Email', value: selectedItem.userEmail || 'Unavailable', icon: Mail },
                { label: 'Phone', value: selectedItem.userPhone || '-', icon: Phone },
                { label: 'Client ID', value: selectedItem.clientId || '-', icon: User },
                { label: 'Source', value: `${selectedItem.source || '-'} / ${selectedItem.sourcePage || '-'}`, icon: Globe },
                { label: 'Submitted At', value: formatDateTime(selectedItem.createdAt), icon: Clock3 },
                { label: 'IP Address', value: selectedItem.ipAddress || '-', icon: Globe },
              ].map((entry) => (
                <div key={entry.label} className="rounded-2xl border border-border/70 bg-secondary/15 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{entry.label}</div>
                  <div className="mt-2 break-words text-sm font-semibold text-foreground">{entry.value}</div>
                </div>
              ))}

              <div className="sm:col-span-2 rounded-2xl border border-border/70 bg-secondary/15 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Page URL</div>
                <div className="mt-2 break-all text-sm font-semibold text-foreground">{selectedItem.pageUrl || '-'}</div>
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-border/70 bg-secondary/15 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Referrer URL</div>
                <div className="mt-2 break-all text-sm font-semibold text-foreground">{selectedItem.referrerUrl || '-'}</div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={actionLoadingId === selectedItem._id} onClick={() => handleStatusUpdate(selectedItem, 'reviewed')}>
                  Mark Reviewed
                </Button>
                <Button size="sm" variant="secondary" disabled={actionLoadingId === selectedItem._id} onClick={() => handleStatusUpdate(selectedItem, 'closed')}>
                  Mark Closed
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanEnquiries;
