import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (email: string, fullName: string, googleId: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('medipro_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<User>('/api/auth/me');
      setUser(res.data);
    } catch {
      localStorage.removeItem('medipro_access_token');
      localStorage.removeItem('medipro_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/api/auth/login', { email, password: pass });
    localStorage.setItem('medipro_access_token', res.data.access_token);
    localStorage.setItem('medipro_refresh_token', res.data.refresh_token);
    setUser(res.data.user);
  };

  const loginWithGoogle = async (email: string, fullName: string, googleId: string) => {
    const res = await api.post('/api/auth/google', {
      email,
      full_name: fullName,
      google_id: googleId
    });
    localStorage.setItem('medipro_access_token', res.data.access_token);
    localStorage.setItem('medipro_refresh_token', res.data.refresh_token);
    setUser(res.data.user);
  };

  const register = async (name: string, email: string, pass: string, role: UserRole) => {
    const res = await api.post('/api/auth/register', {
      full_name: name,
      email,
      password: pass,
      role
    });
    localStorage.setItem('medipro_access_token', res.data.access_token);
    localStorage.setItem('medipro_refresh_token', res.data.refresh_token);
    setUser(res.data.user);
  };

  const verifyOtp = async (email: string, code: string) => {
    await api.post('/api/auth/verify-otp', { email, otp_code: code });
    if (user) {
      setUser({ ...user, is_verified: true });
    }
  };

  const logout = () => {
    localStorage.removeItem('medipro_access_token');
    localStorage.removeItem('medipro_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, verifyOtp, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
