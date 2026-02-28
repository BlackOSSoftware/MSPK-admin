import client from './client';

export const fetchPlans = async (params) => {
    return client.get('/plans', { params });
};

export const createPlan = async (data) => {
    return client.post('/plans', data);
};

export const updatePlan = async (id, data) => {
    return client.patch(`/plans/${id}`, data);
};

export const fetchPlanById = async (id) => {
    return client.get(`/plans/${id}`);
};

export const deletePlan = async (id) => {
    return client.delete(`/plans/${id}`);
};

// Plan Settings (Naive mapping to plans endpoints or specific config endpoints if they existed)
// For now, assuming standard CRUD
