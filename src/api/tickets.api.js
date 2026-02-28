import client from './client';

export const fetchTickets = async (params) => {
    return client.get('/tickets', { params });
};

export const createTicket = async (data) => {
    return client.post('/tickets', data);
};

export const updateTicket = async (id, data) => {
    return client.patch(`/tickets/${id}`, data);
};

export const updateTicketStatus = async (id, status) => {
    return client.patch(`/tickets/${id}`, { status });
};

export const getTicketById = async (id) => {
    return client.get(`/tickets/${id}`);
};

export const replyToTicket = async (id, message) => {
    return client.post(`/tickets/${id}/reply`, { message });
};

export const editTicketMessage = async (ticketId, messageId, message) => {
    return client.patch(`/tickets/${ticketId}/messages/${messageId}`, { message });
};

export const deleteTicketMessage = async (ticketId, messageId) => {
    return client.delete(`/tickets/${ticketId}/messages/${messageId}`);
};
