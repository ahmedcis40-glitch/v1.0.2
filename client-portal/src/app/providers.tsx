'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  user: any | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('webToken');
    if (storedToken) {
      setToken(storedToken);
      api.auth.me(storedToken)
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('webToken');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await api.auth.login(credentials);
      localStorage.setItem('webToken', response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      setLoading(false);
      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      await api.auth.register(data);
      setLoading(false);
      router.push('/');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('webToken');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const userData = await api.auth.me(token);
        setUser(userData);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement utilisateur:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
}
