import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const TablePageFooter = ({
    total = 0,
    overallTotal,
    page = 1,
    totalPages = 1,
    perPage,
    perPageOptions = [10, 20, 50, 100],
    onPerPageChange,
    onPrev,
    onNext,
    from,
    to,
    className,
}) => {
    const safeTotalPages = Math.max(Number(totalPages) || 1, 1);
    const safePage = clamp(Number(page) || 1, 1, safeTotalPages);
    const safePerPage = Number(perPage) || 0;

    const computedFrom = total > 0
        ? (safePerPage ? ((safePage - 1) * safePerPage + 1) : 1)
        : 0;
    const computedTo = total > 0
        ? (safePerPage ? Math.min(safePage * safePerPage, total) : total)
        : 0;

    const showFrom = Number.isFinite(from) ? from : computedFrom;
    const showTo = Number.isFinite(to) ? to : computedTo;

    const canPrev = safePage > 1;
    const canNext = safePage < safeTotalPages;

    return (
        <div
            className={twMerge(
                "terminal-panel dashboard-surface rounded-2xl px-4 py-2",
                "flex items-center justify-between gap-4",
                "text-[10px] font-mono text-muted-foreground uppercase tracking-wider",
                className
            )}
        >
            <div className="flex items-center gap-4 min-w-0">
                <span className="truncate">
                    {total > 0 ? (
                        <>
                            Showing <span className="text-foreground font-bold">{showFrom}-{showTo}</span> of{' '}
                            <span className="text-foreground font-bold">{total}</span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">No records</span>
                    )}
                    {typeof overallTotal === 'number' && (
                        <>
                            <span className="text-muted-foreground/50 mx-2">|</span>
                            Total: <span className="text-foreground font-bold">{overallTotal}</span>
                        </>
                    )}
                </span>

                {onPerPageChange && safePerPage > 0 && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <span>Show:</span>
                        <select
                            value={safePerPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="bg-card text-foreground font-bold border border-border/60 rounded-lg px-2 py-1 focus:outline-none focus:border-primary/50 cursor-pointer"
                        >
                            {perPageOptions.map((opt) => (
                                <option key={opt} value={opt} className="bg-card text-foreground">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <span>
                    Page <span className="text-foreground font-bold">{safePage}</span> of{' '}
                    <span className="text-foreground font-bold">{safeTotalPages}</span>
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={!onPrev || !canPrev}
                        className="p-1.5 rounded-lg border border-transparent hover:border-border/70 hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!onNext || !canNext}
                        className="p-1.5 rounded-lg border border-transparent hover:border-border/70 hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TablePageFooter;

