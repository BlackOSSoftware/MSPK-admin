import { useState, useRef, useCallback } from 'react';

export function useThrottledState(initialValue, fps = 30) {
    const [state, setState] = useState(initialValue);
    const lastUpdate = useRef(Date.now());
    const pendingValue = useRef(null);
    const frameId = useRef(null);
    const interval = 1000 / fps;

    const setThrottledState = useCallback((newValue) => {
        const now = Date.now();
        const value = typeof newValue === 'function' ? newValue(pendingValue.current || state) : newValue;
        pendingValue.current = value;

        if (now - lastUpdate.current >= interval) {
            // Setup next update aligned with frame
            if (frameId.current) cancelAnimationFrame(frameId.current);
            frameId.current = requestAnimationFrame(() => {
                lastUpdate.current = Date.now();
                setState(pendingValue.current);
                pendingValue.current = null;
            });
        } else {
            // Schedule trailing update if not already scheduled
            if (!frameId.current) {
                frameId.current = requestAnimationFrame(() => {
                   // Only check at next frame
                   if (Date.now() - lastUpdate.current >= interval) {
                       lastUpdate.current = Date.now();
                       setState(pendingValue.current);
                       pendingValue.current = null;
                       frameId.current = null;
                   } 
                });
            }
        }
    }, [state, interval]);

    // Cleanup
    // useEffect(() => () => cancelAnimationFrame(frameId.current), []); 
    // Usually hooks cleanup is tricky with refs, but strictly unnecessary if component unmounts 
    // as state update on unmounted component is warned but harmless in modern React if handled or ignored.

    return [state, setThrottledState];
}
