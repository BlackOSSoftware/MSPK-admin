import client from './client';

export const fetchAnnouncements = async (params) => {
    // params can be { status: 'active' | 'scheduled' | 'history' }
    return client.get('/announcements', { params });
};

export const createAnnouncement = async (data) => {
    return client.post('/announcements', data);
};

export const updateAnnouncement = async (id, data) => {
    return client.patch(`/announcements/${id}`, data);
};

export const deleteAnnouncement = async (id) => {
    return client.delete(`/announcements/${id}`);
};

export const fetchAnnouncementById = async (id) => {
    return client.get(`/announcements/${id}`);
};

export const exportAnnouncements = async (params) => {
    const response = await client.get('/announcements/export', { 
        params,
        responseType: 'blob' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `announcements_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
};
