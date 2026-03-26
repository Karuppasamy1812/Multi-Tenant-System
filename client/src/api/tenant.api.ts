import axios from 'axios';
import { BaseUrl } from '@config';
import type { Tenant, Member, TenantStats } from '../lib/types';

export const TenantApi = {
  get:              () => axios.get<Tenant>(`${BaseUrl.API}/tenant`).then(r => r.data),
  update:           (data: { name: string }) => axios.put<Tenant>(`${BaseUrl.API}/tenant`, data).then(r => r.data),
  getStats:         () => axios.get<TenantStats>(`${BaseUrl.API}/tenant/stats`).then(r => r.data),
  getMembers:       () => axios.get<Member[]>(`${BaseUrl.API}/tenant/members`).then(r => r.data),
  updateMemberRole: (userId: string, role: string) => axios.put<Member>(`${BaseUrl.API}/tenant/members/${userId}`, { role }).then(r => r.data),
  removeMember:     (userId: string) => axios.delete(`${BaseUrl.API}/tenant/members/${userId}`).then(r => r.data),
};
