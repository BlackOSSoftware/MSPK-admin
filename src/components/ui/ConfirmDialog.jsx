import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmVariant = "primary", icon: Icon = AlertTriangle, hideCancel = false }) => {
    if (!isOpen) return null;

    const tone =
        confirmVariant === 'danger'
            ? {
                ring: 'ring-rose-500/20',
                glow: 'bg-rose-500/10',
                icon: 'text-rose-500',
                header: 'from-rose-500/15 via-card/95 to-card',
            }
            : {
                ring: 'ring-primary/20',
                glow: 'bg-primary/10',
                icon: 'text-primary',
                header: 'from-primary/15 via-card/95 to-card',
            };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.7)] ring-1 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl ${tone.glow}`} />
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%)]" />

                {/* Header */}
                <div className={`relative px-6 py-4 border-b border-border/60 bg-gradient-to-br ${tone.header}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl border border-border/70 grid place-items-center ${tone.ring} ${tone.glow}`}>
                                {Icon && <Icon className={`h-5 w-5 ${tone.icon}`} />}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">Confirmation</p>
                                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-9 w-9 rounded-lg border border-border/60 bg-background/40 text-muted-foreground hover:text-foreground hover:bg-background/70 transition-colors"
                            aria-label="Close dialog"
                        >
                            <X size={18} className="mx-auto" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {hideCancel ? "Close window" : "Please confirm"}
                    </div>
                    <div className="flex items-center gap-3">
                        {!hideCancel && (
                            <Button className="btn-cancel"
                                variant="outline"
                                onClick={onClose}
                                size="sm"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant={confirmVariant}
                            onClick={onConfirm}
                            size="sm"
                            className="gap-2"
                        >
                            {confirmVariant === 'danger' && <AlertTriangle size={14} />}
                            {confirmVariant === 'primary' && <Check size={14} />}
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
