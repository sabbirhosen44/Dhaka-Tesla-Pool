'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { demoLogin, getMe, UserProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (actorName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('dtp_token');
    if (savedToken) {
      setToken(savedToken);
      getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('dtp_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (actorName: string) => {
    const res = await demoLogin(actorName);
    const token = res.accessToken || res.access_token || '';
    localStorage.setItem('dtp_token', token);
    setToken(token);
    setUser(res.user);
    if (res.user.role === 'DRIVER') {
      router.push('/driver');
    } else {
      router.push('/passenger');
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('dtp_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
