
import client from './client';

export const globalSearch = async (query) => {
    return client.get(`/search?q=${query}`);
};
