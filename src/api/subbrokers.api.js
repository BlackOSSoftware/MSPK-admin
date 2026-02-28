import client from './client';

export const fetchSubBrokers = async () => {
    return await client.get('/sub-brokers');
};

export const getSubBroker = async (id) => {
    return await client.get(`/sub-brokers/${id}`);
};

export const createSubBroker = async (data) => {
    return await client.post('/sub-brokers', data);
};

export const updateSubBroker = async (id, data) => {
    return await client.patch(`/sub-brokers/${id}`, data);
};

export const deleteSubBroker = async (id) => {
    return await client.delete(`/sub-brokers/${id}`);
};

export const processPayout = async (id) => {
    return await client.post(`/sub-brokers/${id}/payout`);
};
