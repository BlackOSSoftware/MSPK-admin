import client from './client';

export const getSettings = async () => {
    const response = await client.get('/settings');
    return response.data;
};

export const updateSettings = async (data) => {
    // Bulk update accepts object { key: value }
    const response = await client.put('/settings', data);
    return response.data;
};

export const updateSingleSetting = async (key, value) => {
    const response = await client.patch(`/settings/${key}`, { value });
    return response.data;
};
