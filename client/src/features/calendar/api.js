import { api } from '@/lib/axios';

export async function fetchCalendarEvents(params = {}) {
  const response = await api.get('/calendar/events', { params });
  return response.data?.data || [];
}

export async function createCalendarEvent(data) {
  const response = await api.post('/calendar/events', data);
  return response.data?.data;
}

export async function updateCalendarEvent(id, data) {
  const response = await api.patch(`/calendar/events/${id}`, data);
  return response.data?.data;
}

export async function deleteCalendarEvent(id) {
  const response = await api.delete(`/calendar/events/${id}`);
  return response.data?.data;
}

export async function checkCalendarConflicts(params = {}) {
  const response = await api.get('/calendar/conflicts', { params });
  return response.data?.data || { hasConflict: false, conflicts: [] };
}

export async function scheduleTaskTimeBlock(data) {
  const response = await api.post('/calendar/time-block', data);
  return response.data?.data;
}
