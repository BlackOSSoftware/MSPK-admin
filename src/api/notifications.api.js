
import client from './client';

export const getMyNotifications = async () => {
    return client.get('/notifications');
};

export const markAsRead = async (id) => {
    return client.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
    return client.patch('/notifications/read-all');
};

export const getNotificationById = async (id) => {
    return client.get(`/notifications/${id}`);
};

export const deleteNotification = async (id) => {
    return client.delete(`/notifications/${id}`);
};
