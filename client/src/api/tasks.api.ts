import axios from 'axios';
import { BaseUrl } from '@config';
import type { Task } from '../lib/types';

export const TasksApi = {
  listByProject: (projectId: string) => axios.get<Task[]>(`${BaseUrl.API}/tasks/project/${projectId}`).then(r => r.data),
  create:        (data: Partial<Task>) => axios.post<Task>(`${BaseUrl.API}/tasks`, data).then(r => r.data),
  update:        (taskId: string, data: Partial<Task>) => axios.put<Task>(`${BaseUrl.API}/tasks/${taskId}`, data).then(r => r.data),
  delete:        (taskId: string) => axios.delete(`${BaseUrl.API}/tasks/${taskId}`).then(r => r.data),
};
