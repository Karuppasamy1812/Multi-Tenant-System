import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useMe, useLogin, useRegisterOrg, useRegisterMember, useLogout } from '../queries/auth.query';
import { getSocket, disconnectSocket } from '../lib/socket';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  registerOrg: (orgName: string, name: string, email: string, password: string) => Promise<void>;
  registerMember: (slug: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const qc = useQueryClient();

  const { data: user, isLoading } = useMe(!!token);
  const { mutateAsync: loginMutation } = useLogin();
  const { mutateAsync: registerOrgMutation } = useRegisterOrg();
  const { mutateAsync: registerMemberMutation } = useRegisterMember();
  const { mutateAsync: logoutMutation } = useLogout();

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      localStorage.setItem('token', newToken);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      qc.clear();
    }
  }, [qc]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const s = getSocket();
      if (!s.connected) s.connect();
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginMutation({ email, password });
    setToken(data.token);
  }, [loginMutation, setToken]);

  const registerOrg = useCallback(async (orgName: string, name: string, email: string, password: string) => {
    const data = await registerOrgMutation({ orgName, name, email, password });
    setToken(data.token);
  }, [registerOrgMutation, setToken]);

  const registerMember = useCallback(async (slug: string, name: string, email: string, password: string) => {
    const data = await registerMemberMutation({ slug, name, email, password });
    setToken(data.token);
  }, [registerMemberMutation, setToken]);

  const logout = useCallback(async () => {
    try { await logoutMutation(); } finally {
      setToken(null);
      disconnectSocket();
    }
  }, [logoutMutation, setToken]);

  return (
    <AuthContext.Provider value={{ user, isLoading, token, setToken, login, registerOrg, registerMember, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
