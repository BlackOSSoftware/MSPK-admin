import client from './client';

export const login = async (credentials) => {
  return client.post('/auth/login', credentials);
};

export const logout = async () => {
    // Optional: Call logout endpoint if exists
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
};
export const getMe = async () => {
    return client.get('/auth/me');
};
