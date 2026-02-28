export const getTradingViewConfig = () => ({
  layout: {
    background: { type: 'solid', color: '#0f172a' },
    textColor: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  grid: {
    vertLines: { color: 'rgba(148, 163, 184, 0.1)', style: 2 },
    horzLines: { color: 'rgba(148, 163, 184, 0.1)', style: 2 }
  },
  crosshair: {
    mode: 1, // Normal mode like TradingView
    vertLine: {
      width: 1,
      color: 'rgba(148, 163, 184, 0.5)',
      style: 3, // Dashed
      labelBackground: '#1e293b'
    },
    horzLine: {
      width: 1,
      color: 'rgba(148, 163, 184, 0.5)',
      style: 3,
      labelBackground: '#1e293b'
    }
  },
  priceScale: {
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderVisible: false, // MSPK: Hide Right Border
    scaleMargins: {
      top: 0.1,
      bottom: 0.2
    },
    entireTextOnly: false,
    ticksVisible: true
  },
  timeScale: {
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderVisible: false, // MSPK: Hide Bottom Border
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 12,
    barSpacing: 6, // TradingView default spacing
    minBarSpacing: 2,
    fixLeftEdge: false, // MSPK: Allow infinite scroll left
    fixRightEdge: false // MSPK: Allow scrolling into future (TradingView style)
  }
});
