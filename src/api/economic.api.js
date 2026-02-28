import client from './client';

export const fetchCalendarEvents = (params) => client.get('/economic-calendar', { params });
