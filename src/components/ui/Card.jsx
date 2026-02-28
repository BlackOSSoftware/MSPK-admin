import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, title, action, noPadding = false, ...props }) => {
    return (
        <div
            {...props}
            className={twMerge(
                "terminal-panel flex flex-col relative rounded-xl overflow-hidden transition-all duration-300",
                className
            )}>
            {(title || action) && (
                <div className="px-3 py-2 flex items-center justify-between border-b border-border bg-secondary/30 shrink-0 min-h-[32px]">
                    {title && <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>}
                    {action && <div className="text-xs">{action}</div>}
                </div>
            )}
            <div className={clsx("flex-1 min-h-0", !noPadding && "p-3")}> {/* Reduced Padding p-6 -> p-3 */}
                {children}
            </div>

            {/* Corner Accents for Tech Feel */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50 opacity-50"></div>
        </div>
    );
};

export default Card;
