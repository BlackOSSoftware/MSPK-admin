import client from './client';

// type: 'revenue' | 'subscription' | 'signals'
// range: 'month' | 'quarter' | 'year'
export const getAnalyticsData = (type, range) => client.get(`/analytics`, { params: { type, range } });

export const exportAnalyticsData = (type, range) => client.get(`/analytics/export`, {
    params: { type, range },
    responseType: 'blob'
});
