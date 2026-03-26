import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TenantApi } from '@api/tenant.api';

export const useTenant = () => useQuery({ queryKey: ['tenant'], queryFn: TenantApi.get });

export const useTenantStats = () => useQuery({ queryKey: ['tenant.stats'], queryFn: TenantApi.getStats });

export const useMembers = () => useQuery({ queryKey: ['tenant.members'], queryFn: TenantApi.getMembers });

export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: TenantApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant'] }),
  });
};

export const useUpdateMemberRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => TenantApi.updateMemberRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant.members'] }),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => TenantApi.removeMember(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant.members'] }),
  });
};
