import client from './client';

export const fetchPlanEnquiries = async () => {
  const response = await client.get('/enquiries/plans');
  return response.data;
};

export const updatePlanEnquiryStatus = async (id, data) => {
  const response = await client.patch(`/enquiries/plans/${id}`, data);
  return response.data;
};
