import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket'; // Adjust path to actual socket service

export function useSocketSubscription(events, dependencies = []) {
    const savedHandler = useRef();

    // Remember the latest handler
    useEffect(() => {
        savedHandler.current = events;
    }, [events]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        
        const handlers = savedHandler.current;
        if (!handlers) return;

        // Register Handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        // Cleanup
        return () => {
             Object.entries(handlers).forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        };
    }, dependencies);
}
