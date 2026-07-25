import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Company } from '@financepro/shared';
import { api, ApiError } from '../services/api';

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (dto: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  setSession: (user: User, company: Company) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
        setCompany(res.company);
      })
      .catch(() => {
        setUser(null);
        setCompany(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setCompany(res.company);
  }, []);

  const register = useCallback(async (dto: { name: string; email: string; password: string; companyName: string }) => {
    const res = await api.register(dto);
    setUser(res.user);
    setCompany(res.company);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setCompany(null);
  }, []);

  const refreshCompany = useCallback(async () => {
    const res = await api.getMe();
    setUser(res.user);
    setCompany(res.company);
  }, []);

  const setSession = useCallback((user: User, company: Company) => {
    setUser(user);
    setCompany(company);
  }, []);

  return (
    <AuthContext.Provider value={{ user, company, isLoading, login, register, logout, refreshCompany, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider');
  }
  return ctx;
}

export { ApiError };
