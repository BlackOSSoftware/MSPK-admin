import client from './client';

export const fetchDashboardStats = async () => {
    return client.get('/dashboard/stats');
};
