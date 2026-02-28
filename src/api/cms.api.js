import client from './client';

export const getPage = (slug) => client.get(`/cms/pages/${slug}`);
export const updatePage = (slug, data) => client.post(`/cms/pages/${slug}`, data);

export const getFAQs = () => client.get('/cms/faqs');
export const createFAQ = (data) => client.post('/cms/faqs', data);
export const updateFAQ = (id, data) => client.patch(`/cms/faqs/${id}`, data);
export const deleteFAQ = (id) => client.delete(`/cms/faqs/${id}`);
