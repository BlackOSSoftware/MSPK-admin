import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />
};

const styles = {
    success: "border-l-4 border-emerald-500 bg-emerald-500/10 text-emerald-100",
    error: "border-l-4 border-rose-500 bg-rose-500/10 text-rose-100",
    info: "border-l-4 border-blue-500 bg-blue-500/10 text-blue-100",
    warning: "border-l-4 border-amber-500 bg-amber-500/10 text-amber-100"
};

const Toast = ({ id, message, type = 'info', duration = 5000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <div className={`relative flex items-start gap-3 p-4 rounded-md shadow-lg backdrop-blur-md border border-white/5 w-80 mb-3 transition-all animate-in slide-in-from-right-full duration-300 ${styles[type]}`}>
            <div className="shrink-0 pt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium leading-5">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="shrink-0 text-white/40 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
