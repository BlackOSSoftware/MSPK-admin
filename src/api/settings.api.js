import client from './client';

// Get all settings as a key-value map
export const getAllSettings = async () => {
    const response = await client.get('/settings');
    return response.data;
};

// Update a single setting
export const updateSetting = async (key, value) => {
    const response = await client.patch('/settings', { key, value });
    return response.data;
};

// Update multiple settings at once
export const updateBulkSettings = async (settings) => {
    const response = await client.put('/settings/bulk', settings);
    return response.data;
};
