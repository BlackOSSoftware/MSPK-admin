import React from 'react';
import { X, Download, Share2, Copy } from 'lucide-react';

const SnapshotModal = ({ isOpen, onClose, imageSrc, fileName }) => {
    if (!isOpen || !imageSrc) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = fileName || `MSPK_Chart_${Date.now()}.png`;
        link.href = imageSrc;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                const blob = await (await fetch(imageSrc)).blob();
                const file = new File([blob], fileName || 'chart.png', { type: 'image/png' });
                await navigator.share({
                    title: 'MSPK TRADE SOLUTIONS Chart',
                    text: 'Check out this chart analysis from MSPK TRADE SOLUTIONS!',
                    files: [file],
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                const blob = await (await fetch(imageSrc)).blob();
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                alert('Image copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy image: ', err);
                alert('Sharing not supported on this browser.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                    <h2 className="font-bold text-lg text-foreground">Snapshot Preview</h2>
                    <button onClick={onClose} className="p-1 hover:bg-accent rounded-full transition text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Image Preview */}
                <div className="flex-1 overflow-auto p-4 bg-black/50 flex items-center justify-center">
                    <img src={imageSrc} alt="Chart Snapshot" className="max-w-full max-h-full object-contain rounded shadow-lg border border-white/10" />
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-medium hover:bg-accent transition text-muted-foreground"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition"
                    >
                        <Share2 size={16} />
                        share
                    </button>

                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition shadow-lg shadow-primary/25"
                    >
                        <Download size={16} />
                        Save Image
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SnapshotModal;