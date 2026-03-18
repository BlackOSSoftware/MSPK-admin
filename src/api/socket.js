// Use the same base URL as API client, but remove /v1 suffix for socket
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';
const baseUrl = apiBase.replace('/v1', '').replace('http', 'ws');

import monitor from '../utils/monitoring/MonitoringService';

let wsInstance = null;
const listeners = new Map();
const sendQueue = [];
let reconnectTimer = null;
let reconnectSuppressed = false;

const normalizeToken = (value) => {
    const token = String(value || '')
        .trim()
        .replace(/^Bearer\s+/i, '')
        .replace(/^"+|"+$/g, '');

    if (!token || token === 'null' || token === 'undefined') return '';
    return token;
};

const isLikelyJwt = (token) => token.split('.').length === 3;

const SERVER_AUTH_CLOSE_CODE = 1008;
const CLIENT_AUTH_CLOSE_CODE = 4001;

const isAuthSocketIssue = (code, reason = '') => {
    const normalizedReason = String(reason || '').trim().toLowerCase();
    if (code === SERVER_AUTH_CLOSE_CODE || code === CLIENT_AUTH_CLOSE_CODE) return true;
    return /session expired|authentication failed|invalid connection url|user not found/.test(normalizedReason);
};

const clearAdminSession = () => {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('session_id');
    } catch {
        // ignore storage errors
    }

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const getSocketUrl = () => {
    const token = normalizeToken(localStorage.getItem('token'));
    if (!token || !isLikelyJwt(token)) return null;
    return `${baseUrl}/?token=${encodeURIComponent(token)}&autoSubscribe=false`;
};

const scheduleReconnect = () => {
    if (reconnectSuppressed) return;
    window.clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(() => {
        initSocket();
    }, 5000);
};

const initSocket = () => {
    // If we're on a browser, handle the connection
    if (typeof window === 'undefined') return;
    if (reconnectSuppressed) return;

    if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const wsUrl = getSocketUrl();
    if (!wsUrl) {
        return;
    }

    wsInstance = new WebSocket(wsUrl);

    wsInstance.onopen = () => {
        console.log('socket connected');
        reconnectSuppressed = false;
        window.clearTimeout(reconnectTimer);
        // Flush queue
        while (sendQueue.length > 0) {
            const msg = sendQueue.shift();
            wsInstance.send(JSON.stringify(msg));
        }

        if (listeners.has('connect')) {
            listeners.get('connect').forEach(callback => callback());
        }
    };

    wsInstance.onclose = (event) => {
        console.log('socket disconnected');
        if (listeners.has('disconnect')) {
            listeners.get('disconnect').forEach(callback => callback());
        }
        wsInstance = null;
        if (isAuthSocketIssue(event?.code, event?.reason)) {
            reconnectSuppressed = true;
            clearAdminSession();
            return;
        }
        scheduleReconnect();
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

            if (type === 'error' && /session expired|authentication failed/i.test(String(payload || ''))) {
                reconnectSuppressed = true;
                try {
                    wsInstance?.close(CLIENT_AUTH_CLOSE_CODE, 'Session expired');
                } catch {
                    // ignore close errors
                }
                clearAdminSession();
                return;
            }
            
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
        initSocket();
    },
    off: (event, callback) => {
        if (listeners.has(event)) {
            if (callback) {
                listeners.get(event).delete(callback);
            } else {
                listeners.get(event).clear();
            }
        }
    },
    emit: (type, payload) => {
        // Lowercase room names if subscribing
        let actualPayload = payload;
        if (type === 'subscribe' || type === 'unsubscribe') {
            actualPayload = payload?.toString().toLowerCase();
        }
        const msg = { type, payload: actualPayload };
        if (reconnectSuppressed) return;
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
