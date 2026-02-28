import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmVariant = "primary", icon: Icon = AlertTriangle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {Icon && <Icon className={`h-5 w-5 ${confirmVariant === 'danger' ? 'text-red-500' : 'text-primary'}`} />}
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        size="sm"
                    >
                        Cancel
                    </Button>
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
    );
};

export default ConfirmDialog;
