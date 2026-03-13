import client from './client';

export const fetchSignals = async (params) => {
  return client.get('/signals', { params });
};

export const exportSignalReport = async (params) => {
  const response = await client.get('/signals/report/export', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `signal_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
