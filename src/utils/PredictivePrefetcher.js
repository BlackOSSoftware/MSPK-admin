export class PredictivePrefetcher {
    constructor() {
        this.history = [];
        this.maxHistory = 20;
    }

    track(symbol) {
        if (!symbol) return;
        // Don't duplicate tip
        if (this.history[this.history.length - 1] === symbol) return;
        
        this.history.push(symbol);
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    predict(currentSymbol, watchlist = []) {
        const predictions = new Set();
        
        // 1. Sequential (Watchlist Next/Prev)
        const idx = watchlist.findIndex(s => s.symbol === currentSymbol);
        if (idx !== -1) {
            if (idx + 1 < watchlist.length) predictions.add(watchlist[idx + 1].symbol);
            if (idx - 1 >= 0) predictions.add(watchlist[idx - 1].symbol);
        }

        // 2. Temporal (Recently Used Back Button)
        if (this.history.length > 1) {
            const prev = this.history[this.history.length - 2];
            if (prev !== currentSymbol) predictions.add(prev);
        }
        
        return Array.from(predictions);
    }
}

export const prefetcher = new PredictivePrefetcher();
export default prefetcher;
