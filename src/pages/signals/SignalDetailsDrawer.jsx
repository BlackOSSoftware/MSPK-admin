import React, { useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import SignalReportView from './SignalReportView';

const SignalDetailsDrawer = ({
    isOpen,
    signal,
    detailSignal,
    history = [],
    stats,
    reportSummary,
    pagination,
    isLoading,
    error,
    onClose,
    onOpenReport,
    onSelectSignal,
}) => {
    useEffect(() => {
        if (!isOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !signal) return null;

    return (
        <div className="fixed inset-0 z-[9998]">
            <button
                type="button"
                aria-label="Close signal details"
                onClick={onClose}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <div className="absolute inset-y-0 right-0 flex w-full justify-end">
                <div className="relative flex h-full w-full max-w-[920px] flex-col border-l border-border/70 bg-card shadow-[0_24px_80px_-30px_rgba(0,0,0,0.85)]">
                    <div className="custom-scrollbar relative flex-1 overflow-y-auto p-5">
                        <SignalReportView
                            signal={signal}
                            detailSignal={detailSignal}
                            history={history}
                            stats={stats}
                            reportSummary={reportSummary}
                            pagination={pagination}
                            isLoading={isLoading}
                            error={error}
                            onSelectSignal={onSelectSignal}
                            badgeLabel="Signal Detail"
                            description="Complete summary for the same symbol and timeframe, including hit ratio, points outcome, and timeline."
                            actions={
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="btn-cancel gap-2"
                                        onClick={onOpenReport}
                                    >
                                        <ExternalLink size={14} />
                                        Open Full Report
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-xl border border-border/70 bg-background/60 p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                    >
                                        <X size={18} />
                                    </button>
                                </>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignalDetailsDrawer;
