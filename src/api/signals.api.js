import client from './client';

export const fetchSignals = async (params) => {
  return client.get('/signals', { params });
};

export const createSignal = async (data) => {
  return client.post('/signals', data);
};

export const updateSignal = async (id, data) => {
    return client.patch(`/signals/${id}`, data);
};

export const deleteSignal = async (id) => {
    return client.delete(`/signals/${id}`);
};
