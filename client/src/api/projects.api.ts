import axios from 'axios';
import { BaseUrl } from '@config';
import type { Project } from '../lib/types';

export const ProjectsApi = {
  list:      () => axios.get<Project[]>(`${BaseUrl.API}/projects`).then(r => r.data),
  get:       (id: string) => axios.get<Project>(`${BaseUrl.API}/projects/${id}`).then(r => r.data),
  create:    (data: { name: string; description: string }) => axios.post<Project>(`${BaseUrl.API}/projects`, data).then(r => r.data),
  update:    (id: string, data: { name: string; description: string }) => axios.put<Project>(`${BaseUrl.API}/projects/${id}`, data).then(r => r.data),
  archive:   (id: string) => axios.delete(`${BaseUrl.API}/projects/${id}`).then(r => r.data),
  addMember: (id: string, data: { userId: string; role: string }) => axios.post<Project>(`${BaseUrl.API}/projects/${id}/members`, data).then(r => r.data),
  addList:   (id: string, data: { title: string }) => axios.post<Project>(`${BaseUrl.API}/projects/${id}/lists`, data).then(r => r.data),
};
