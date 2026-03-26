import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '@api/auth.api';
import { getSocket, disconnectSocket } from '../lib/socket';

export const useMe = (enabled: boolean) =>
  useQuery({
    queryKey: ['auth.me'],
    queryFn: AuthApi.me,
    enabled,
    staleTime: Infinity,
    retry: false,
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.login,
    onSuccess: (data) => {
      qc.setQueryData(['auth.me'], data.user);
      const s = getSocket();
      s.auth = { token: data.token };
      s.connect();
    },
  });
};

export const useRegisterOrg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.registerOrg,
    onSuccess: (data) => {
      qc.setQueryData(['auth.me'], data.user);
      const s = getSocket();
      s.auth = { token: data.token };
      s.connect();
    },
  });
};

export const useRegisterMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.registerMember,
    onSuccess: (data) => {
      qc.setQueryData(['auth.me'], data.user);
      const s = getSocket();
      s.auth = { token: data.token };
      s.connect();
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.logout,
    onSettled: () => { qc.clear(); disconnectSocket(); },
  });
};
