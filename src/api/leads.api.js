import client from './client';

export const getLeads = async () => {
    const response = await client.get('/leads');
    return response.data;
};

export const approveLead = async (id) => {
    const response = await client.post(`/leads/${id}/approve`);
    return response.data;
};

export const updateLead = async (id, data) => {
    const response = await client.patch(`/leads/${id}`, data);
    return response.data;
};

export const deleteLead = async (id) => {
    const response = await client.delete(`/leads/${id}`);
    return response.data;
};
