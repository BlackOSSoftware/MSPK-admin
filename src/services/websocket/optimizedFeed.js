/**
 * WebSocket Feed
 * Batch ticks for 60fps rendering
 */
class OptimizedWebSocketFeed {
  constructor(socket) {
    this.socket = socket;
    this.messageQueue = [];
    this.batchInterval = 16.6; // ~60fps target
    this.lastRenderTime = 0;
    this.pendingFrame = null;
    this.subscribers = new Set();
  }

  /**
   * Add a subscriber (usually useChartRealtime or similar)
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Handle incoming raw message
   */
  onMessage(data) {
    // Queue message instead of immediate processing
    this.messageQueue.push(data);
    
    // Schedule batch processing if not already scheduled
    if (!this.pendingFrame) {
      this.pendingFrame = requestAnimationFrame(this.processBatch.bind(this));
    }
  }

  /**
   * Process batched messages
   */
  processBatch(timestamp) {
    const elapsed = timestamp - this.lastRenderTime;

    // Optional: Throttle if needed. But RAF already handles most of this.
    // if (elapsed < this.batchInterval) {
    //   this.pendingFrame = requestAnimationFrame(this.processBatch.bind(this));
    //   return;
    // }

    if (this.messageQueue.length === 0) {
      this.pendingFrame = null;
      return;
    }

    // Process all queued messages
    const batch = this.messageQueue.splice(0, this.messageQueue.length);
    
    // Deduplicate updates
    const aggregated = this.aggregateUpdates(batch);
    
    // Notify subscribers
    this.subscribers.forEach(callback => {
        aggregated.forEach(tick => callback(tick));
    });
    
    this.lastRenderTime = timestamp;
    this.pendingFrame = null;
  }

  /**
   * Aggregates multiple updates for the same symbol into one (takes the latest)
   */
  aggregateUpdates(batch) {
    const map = new Map();
    // Assuming messages have a 'symbol' or 'ticketId' field
    batch.forEach(msg => {
        const id = msg.symbol || msg.ticketId || 'all';
        map.set(id, msg);
    });
    return Array.from(map.values());
  }

  /**
   * Start listening to the socket
   */
  connect() {
    this.socket.on('tick', (data) => this.onMessage(data));
    this.socket.on('new_ticket_message', (data) => this.onMessage(data));
  }
}

export default OptimizedWebSocketFeed;
