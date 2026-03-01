import React from 'react';
import { twMerge } from 'tailwind-merge';

const TableEmptyState = ({ icon: Icon, title, description, className }) => {
    return (
        <div
            className={twMerge(
                "absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3",
                "bg-card/70 backdrop-blur-sm border border-border/40 rounded-2xl",
                "pointer-events-none",
                className
            )}
        >
            {Icon && <Icon size={48} strokeWidth={1} />}
            <div className="text-center">
                {title && <p className="text-sm font-semibold tracking-tight text-foreground/80">{title}</p>}
                {description && <p className="text-[11px] text-muted-foreground mt-1">{description}</p>}
            </div>
        </div>
    );
};

export default TableEmptyState;

