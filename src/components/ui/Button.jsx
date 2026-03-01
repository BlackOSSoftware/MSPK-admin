import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
    const baseStyles = "ui-btn soft-shadow-hover inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20 font-semibold",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        outline: "bg-transparent text-primary border border-primary/50 hover:border-primary hover:bg-primary/10",
        danger: "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            data-variant={variant}
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
