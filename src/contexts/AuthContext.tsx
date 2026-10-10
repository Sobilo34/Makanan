'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, User } from '@/lib/api';

interface AuthSession {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  isEmailVerified: () => boolean;
  getUserProfile: () => Promise<User | null>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const cached = api.getUser();
      if (cached) {
        setUser(cached);
        setSession({ access_token: token, user: cached });
      }

      const me = await api.getMe();
      setUser(me);
      setSession({ access_token: token, user: me });
    } catch (err) {
      console.warn('Session verification failed, clearing credentials:', err);
      api.logout();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, metadata: any = {}) => {
    const res = await api.signup({
      email,
      password,
      full_name: metadata?.fullName || metadata?.full_name || '',
      student_id: metadata?.studentId || metadata?.student_id || '',
      role: metadata?.role || 'student',
    });

    setUser(res.user);
    setSession({ access_token: res.access_token, user: res.user });
    return { data: { user: res.user, session: { access_token: res.access_token } }, error: null };
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setSession({ access_token: res.access_token, user: res.user });
    return { data: { user: res.user, session: { access_token: res.access_token } }, error: null };
  };

  // Sign Out
  const signOut = async () => {
    api.logout();
    setUser(null);
    setSession(null);
  };

  // Get Current User
  const getCurrentUser = async (): Promise<User | null> => {
    if (user) return user;
    try {
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  };

  // Check if Email is Verified
  const isEmailVerified = () => {
    return user ? user.is_active : false;
  };

  // Get User Profile
  const getUserProfile = async (): Promise<User | null> => {
    if (user) return user;
    return getCurrentUser();
  };

  // Refresh User Data
  const refreshUser = async (): Promise<User | null> => {
    try {
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
