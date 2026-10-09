import { api } from '@/lib/axios';

export async function fetchTasks(params = {}) {
  const response = await api.get('/tasks', { params });
  return response.data?.data || [];
}

export async function fetchTaskSummary() {
  const response = await api.get('/tasks/summary');
  return response.data?.data || {};
}

export async function fetchTaskById(id) {
  const response = await api.get(`/tasks/${id}`);
  return response.data?.data;
}

export async function createTask(data) {
  const response = await api.post('/tasks', data);
  return response.data?.data;
}

export async function updateTask(id, data) {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data?.data;
}

export async function completeTask(id) {
  const response = await api.post(`/tasks/${id}/complete`);
  return response.data?.data;
}

export async function uncompleteTask(id) {
  const response = await api.post(`/tasks/${id}/uncomplete`);
  return response.data?.data;
}

export async function deleteTask(id) {
  const response = await api.delete(`/tasks/${id}`);
  return response.data?.data;
}
