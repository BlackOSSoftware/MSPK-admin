import client from './client';

export const fetchEnquiries = async () => {
    return client.get('/enquiries');
};

export const updateEnquiryStatus = async (id, status) => {
    return client.patch(`/enquiries/${id}`, { status });
};
