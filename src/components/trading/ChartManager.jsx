import { useRef, useCallback } from 'react';

/**
 * useOptimizedChartUpdates
 * Provides batched, deduplicated updates for chart elements
 */
export const useOptimizedChartUpdates = (chartRef) => {
    const markerQueue = useRef([]);
    const isMarkerUpdating = useRef(false);

    /**
     * Batched marker updates using Microtasks
     */
    const queueMarkerUpdate = useCallback((markers, onUpdate) => {
        markerQueue.current.push(...markers);

        if (!isMarkerUpdating.current) {
            isMarkerUpdating.current = true;

            // Use microtask batching (Promise.resolve) to collapse multiple calls in same event loop
            Promise.resolve().then(() => {
                const batch = markerQueue.current.splice(0, markerQueue.current.length);
                if (batch.length > 0) {
                    // Deduplicate markers by time and type (Keep latest)
                    const uniqueMarkers = deduplicateMarkers(batch);

                    if (onUpdate) {
                        onUpdate(uniqueMarkers);
                    } else if (chartRef?.current) {
                        // Direct internal update logic if needed
                    }
                }
                isMarkerUpdating.current = false;
            });
        }
    }, [chartRef]);

    return { queueMarkerUpdate };
};

/**
 * Deduplicates markers by time and text to prevent visual overlaps
 */
function deduplicateMarkers(markers) {
    const map = new Map();
    markers.forEach(m => {
        const key = `${m.time}_${m.text}`;
        map.set(key, m);
    });
    return Array.from(map.values()).sort((a, b) => a.time - b.time);
}
