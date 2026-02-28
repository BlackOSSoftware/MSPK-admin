import React from 'react';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'default', className }) => {
    const variants = {
        default: "bg-secondary text-secondary-foreground border-border",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        danger: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        neon: "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
    };

    return (
        <span className={twMerge(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm transition-all",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};

export default Badge;
