import client from './client';

export const getAllSubscriptions = (params) => client.get('/subscriptions/admin/all', { params });
export const assignPlan = (data) => client.post('/subscriptions/admin/assign', data);
export const extendSubscription = (subscriptionId, data) => client.patch(`/subscriptions/admin/${subscriptionId}/extend`, data);
