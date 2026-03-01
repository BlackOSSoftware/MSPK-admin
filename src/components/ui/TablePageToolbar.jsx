import React from 'react';
import { twMerge } from 'tailwind-merge';

const TablePageToolbar = ({ title, subtitle, icon: Icon, left, right, className }) => {
    return (
        <div
            className={twMerge(
                "terminal-panel dashboard-surface rounded-2xl px-4 py-3",
                "flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                className
            )}
        >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-3 shrink-0">
                    {Icon && (
                        <div className="h-9 w-9 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-center text-primary">
                            <Icon size={16} />
                        </div>
                    )}
                    <div className="min-w-0">
                        {subtitle && (
                            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold">
                                {subtitle}
                            </p>
                        )}
                        {title && <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>}
                    </div>
                </div>

                {left && <div className="flex flex-wrap items-center gap-4 w-full md:w-auto relative z-20">{left}</div>}
            </div>

            {right && <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto z-10">{right}</div>}
        </div>
    );
};

export default TablePageToolbar;

