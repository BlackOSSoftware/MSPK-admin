// Use the same base URL as API client, but remove /v1 suffix for socket
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';
const baseUrl = apiBase.replace('/v1', '').replace('http', 'ws');

const token = localStorage.getItem('token');
const wsUrl = `${baseUrl}/?token=${token}`;

import monitor from '../utils/monitoring/MonitoringService';

let wsInstance = null;
const listeners = new Map();
const sendQueue = [];

const initSocket = () => {
    // If we're on a browser, handle the connection
    if (typeof window === 'undefined') return;

    if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
        return;
    }

    wsInstance = new WebSocket(wsUrl);

    wsInstance.onopen = () => {
        console.log('socket connected');
        // Flush queue
        while (sendQueue.length > 0) {
            const msg = sendQueue.shift();
            wsInstance.send(JSON.stringify(msg));
        }

        if (listeners.has('connect')) {
            listeners.get('connect').forEach(callback => callback());
        }
    };

    wsInstance.onclose = () => {
        console.log('socket disconnected');
        if (listeners.has('disconnect')) {
            listeners.get('disconnect').forEach(callback => callback());
        }
        // Basic reconnect
        setTimeout(initSocket, 5000);
    };

    wsInstance.onerror = (err) => {
        console.error('socket connection error:', err);
    };

    wsInstance.onmessage = (event) => {
        try {
            // Monitor Inbound
            monitor.increment('wsMessages');
            
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            
            // Latency tracking if timestamp exists
            if (payload && payload.timestamp) {
                const ts = new Date(payload.timestamp).getTime();
                const now = Date.now();
                if (ts > 0 && now - ts >= 0) {
                     monitor.record('latency', now - ts);
                }
            }

            // Special handling for subscription rooms (normalization)
            if (type === 'new_ticket_message' && payload.ticketId) {
                payload.ticketId = payload.ticketId.toString().toLowerCase();
            }

            if (listeners.has(type)) {
                listeners.get(type).forEach(callback => callback(payload));
            }
        } catch (e) {
            console.error('WS parsing error:', e);
            monitor.increment('errors');
        }
    };
};

initSocket();

export const socketWrapper = {
    on: (event, callback) => {
        if (!listeners.has(event)) {
            listeners.set(event, new Set());
        }
        listeners.get(event).add(callback);
    },
    off: (event, callback) => {
        if (listeners.has(event)) {
            listeners.get(event).delete(callback);
        }
    },
    emit: (type, payload) => {
        // Lowercase room names if subscribing
        let actualPayload = payload;
        if (type === 'subscribe' || type === 'unsubscribe') {
            actualPayload = payload?.toString().toLowerCase();
        }
        const msg = { type, payload: actualPayload };
        if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
            wsInstance.send(JSON.stringify(msg));
        } else {
            console.log('WS: Queuing message (connecting...)', type);
            sendQueue.push(msg);
            // Ensure socket is initialized if it was called before script load
            if (!wsInstance) initSocket();
        }
    }
};

export const socket = socketWrapper;
export const getSocket = () => socketWrapper;
export default socketWrapper;
