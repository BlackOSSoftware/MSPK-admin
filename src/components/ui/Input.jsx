import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({ label, error, className, ...props }, ref) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="block text-sm font-medium text-muted-foreground ml-1">{label}</label>}
            <div className="relative group">
                <input
                    ref={ref}
                    className={clsx(
                        "w-full bg-secondary/30 border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:bg-secondary/50",
                        error
                            ? "border-destructive/50 focus:ring-destructive/30"
                            : "border-input group-hover:border-border",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-destructive ml-1">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
