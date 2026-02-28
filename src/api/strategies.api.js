import client from './client';

export const getStrategies = async () => {
    // Add timestamp to prevent 304 Not Modified caching
    const response = await client.get(`/strategies?t=${Date.now()}`);
    return response.data;
};

export const createStrategy = async (data) => {
    const response = await client.post('/strategies', data);
    return response.data;
};

export const updateStrategy = async (id, data) => {
    const response = await client.patch(`/strategies/${id}`, data);
    return response.data;
};

export const deleteStrategy = async (id) => {
    const response = await client.delete(`/strategies/${id}`);
    return response.data;
};
