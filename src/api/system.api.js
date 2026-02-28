import client from './client';

export const getSystemHealth = async () => {
    const response = await client.get('/health');
    return response.data;
};
