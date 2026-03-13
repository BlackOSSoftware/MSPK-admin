import client from './client';

export const fetchUsers = async (params) => {
  return client.get('/admin/users', { params });
};

export const exportUsers = async (params) => {
  const response = await client.get('/admin/users/export', {
    params,
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return true;
};

export const fetchUserById = async (id) => {
  return client.get(`/admin/users/${id}`);
};

export const updateUser = async (id, data) => {
    return client.patch(`/admin/users/${id}`, data);
};

export const assignCustomPlan = async (id, data) => {
    return client.post(`/admin/users/${id}/custom-plan`, data);
};

export const fetchUserSignalDeliveries = async (id, params) => {
    return client.get(`/admin/users/${id}/signal-deliveries`, { params });
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

