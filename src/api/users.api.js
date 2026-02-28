import client from './client';

export const fetchUsers = async (params) => {
  return client.get('/admin/users', { params });
};

export const fetchUserById = async (id) => {
  return client.get(`/admin/users/${id}`);
};

export const updateUser = async (id, data) => {
    return client.patch(`/admin/users/${id}`, data);
};

export const updateSignalAccess = async (id, data) => {
    return client.patch(`/admin/users/${id}/signals`, data);
};

export const createUser = async (data) => {
    return client.post('/admin/users', data);
};

export const deleteUser = async (id) => {
    return client.delete(`/admin/users/${id}`);
};

export const blockUser = async (id) => {
    return client.patch(`/admin/users/${id}/block`);
};

export const liquidateUser = async (id) => {
    return client.patch(`/admin/users/${id}/liquidate`);
};
