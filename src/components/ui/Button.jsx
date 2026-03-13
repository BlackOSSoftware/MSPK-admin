import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
    const baseStyles = "ui-btn soft-shadow-hover inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[0.5px] group relative";

    const variants = {
        primary: "relative overflow-hidden bg-primary text-primary-foreground border border-transparent shadow-[0_12px_24px_-12px_hsl(var(--primary)/0.6)] hover:shadow-[0_18px_32px_-14px_hsl(var(--primary)/0.75)] hover:brightness-[1.02]",
        secondary: "bg-secondary/80 text-secondary-foreground border border-border hover:bg-secondary hover:border-border/80 shadow-sm",
        outline: "bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10",
        danger: "relative overflow-hidden bg-destructive text-destructive-foreground border border-destructive/30 shadow-[0_12px_24px_-12px_rgba(239,68,68,0.5)] hover:shadow-[0_18px_32px_-14px_rgba(239,68,68,0.65)]",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
    };

    const sizes = {
        sm: "px-3.5 py-1.5 text-xs",
        md: "px-4.5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            data-variant={variant}
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {(variant === 'primary' || variant === 'danger') && (
                <>
                    <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute -inset-x-6 -top-6 h-10 bg-white/35 blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                </>
            )}
            {children}
        </button>
    );
};

export default Button;
