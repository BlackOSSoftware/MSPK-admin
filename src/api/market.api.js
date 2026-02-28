import client from './client';

export const getSegments = async () => {
    const response = await client.get('/market/segments');
    return response.data;
};

export const getSymbols = async (params) => {
    let query = '';
    if (typeof params === 'string') {
        query = `?segment=${params}`;
    } else if (typeof params === 'object') {
        const usp = new URLSearchParams(params).toString();
        query = `?${usp}`;
    }
    const response = await client.get(`/market/symbols${query}`);
    return response.data;
};
export const searchInstruments = async (q) => {
    const response = await client.get(`/market/search?q=${q}`);
    return response.data;
};

export const getHistory = async (symbol, resolution, from, to) => {
    const params = { symbol, resolution, from, to };
    const response = await client.get('/market/history', { params });
    return response.data;
};


export const getMarketStats = async () => {
    const response = await client.get('/market/stats');
    return response.data;
};

export const getLoginUrl = async (provider) => {
    const response = await client.get(`/market/login/${provider}/url`);
    return response.data;
};

export const verifyBrokerLogin = async (provider, authCode) => {
    // Fyers sends 'auth_code' in the query string
    const response = await client.get(`/market/login/${provider}?auth_code=${authCode}`);
    return response.data;
};

// --- CRUD Operations ---

export const createSegment = async (data) => {
    const response = await client.post('/market/segments', data);
    return response.data;
};

export const updateSegment = async (id, data) => {
    const response = await client.patch(`/market/segments/${id}`, data);
    return response.data;
};

export const deleteSegment = async (id) => {
    const response = await client.delete(`/market/segments/${id}`);
    return response.data;
};

export const createSymbol = async (data) => {
    const response = await client.post('/market/symbols', data);
    return response.data;
};

export const updateSymbol = async (id, data) => {
    const response = await client.patch(`/market/symbols/${id}`, data);
    return response.data;
};

export const deleteSymbol = async (id) => {
    const response = await client.delete(`/market/symbols/${id}`);
    return response.data;
};
