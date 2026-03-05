import client from './client';

export const fetchBlogs = async (params) => {
  return client.get('/blogs', { params });
};

export const fetchBlogById = async (id) => {
  return client.get(`/blogs/${id}`);
};

export const createBlog = async (payload) => {
  return client.post('/blogs', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateBlog = async (id, payload) => {
  return client.patch(`/blogs/${id}`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteBlog = async (id) => {
  return client.delete(`/blogs/${id}`);
};
