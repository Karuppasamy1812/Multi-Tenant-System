import axios from 'axios';
import { BaseUrl } from '@config';
import type { User } from '../lib/types';

export interface AuthResponse { token: string; user: User; }

export const AuthApi = {
  me:             () => axios.get<User>(`${BaseUrl.API}/auth/me`).then(r => r.data),
  login:          (data: { email: string; password: string }) => axios.post<AuthResponse>(`${BaseUrl.API}/auth/login`, data).then(r => r.data),
  registerOrg:    (data: { orgName: string; name: string; email: string; password: string }) =>
    axios.post<AuthResponse>(`${BaseUrl.API}/auth/register`, { ...data, type: 'org' }).then(r => r.data),
  registerMember: (data: { slug: string; name: string; email: string; password: string }) =>
    axios.post<AuthResponse>(`${BaseUrl.API}/auth/register`, { ...data, type: 'member' }).then(r => r.data),
  logout:         () => axios.post(`${BaseUrl.API}/auth/logout`).then(r => r.data),
};
