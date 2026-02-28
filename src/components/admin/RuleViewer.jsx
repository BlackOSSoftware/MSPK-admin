import React from 'react';
import Card from '../ui/Card';

const RuleViewer = ({ title, content, lastUpdated = "2025-12-11" }) => {
    return (
        <div className="h-full flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 bg-secondary/20 border border-border p-2">
                <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    &gt; CAT {title.replace(/\s+/g, '_').toUpperCase()}.TXT
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground">LAST_UPDATED: {lastUpdated}</span>
            </div>

            {/* Console View */}
            <Card className="flex-1 bg-black border border-border overflow-hidden relative font-mono text-xs shadow-none" noPadding>
                {/* Scanline Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none opacity-20 background-size-[100%_2px,3px_100%]"></div>

                <div className="p-4 overflow-y-auto h-full custom-scrollbar text-emerald-500/90 whitespace-pre-wrap leading-relaxed">
                    {content}
                </div>
            </Card>
        </div>
    );
};

export default RuleViewer;
