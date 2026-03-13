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
    leftExtra,
    rightExtra,
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
                "dashboard-surface rounded-2xl px-3 py-2.5 sm:px-4 sm:py-2.5",
                "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                "border border-border/70 bg-card/80 shadow-none",
                "text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
                className
            )}
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 min-w-0">
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
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline">Show</span>
                        <span className="sm:hidden">Per</span>
                        <select
                            value={safePerPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="bg-background/60 text-foreground font-bold border border-border/70 rounded-lg px-2 py-1 text-[9px] sm:text-[10px] focus:outline-none focus:border-primary/50 cursor-pointer"
                            aria-label="Items per page"
                        >
                            {perPageOptions.map((opt) => (
                                <option key={opt} value={opt} className="bg-card text-foreground">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {leftExtra && (
                    <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px]">
                        {leftExtra}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
                <div className="px-2.5 py-1 rounded-full border border-border/70 bg-background/60 text-foreground/90 text-[9px] sm:text-[10px]">
                    Page <span className="font-bold text-foreground">{safePage}</span> /{' '}
                    <span className="font-bold text-foreground">{safeTotalPages}</span>
                </div>
                <div className="inline-flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={!onPrev || !canPrev}
                        className="h-7 w-7 sm:h-8 sm:w-8 grid place-items-center rounded-full border border-border/70 bg-background/60 hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!onNext || !canNext}
                        className="h-7 w-7 sm:h-8 sm:w-8 grid place-items-center rounded-full border border-border/70 bg-background/60 hover:bg-muted/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>

                {rightExtra && (
                    <div className="flex items-center gap-2">
                        {rightExtra}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TablePageFooter;

