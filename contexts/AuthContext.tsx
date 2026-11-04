import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; msg?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // 1. INIT: Check Session on Load
  useEffect(() => {
    const initAuth = async () => {
      // Fast load from cache
      const cached = authService.getUser();
      if (cached) setUser(cached);

      // Verify with backend
      const verifiedUser = await authService.verifySession();
      if (verifiedUser) {
        setUser(verifiedUser);
        localStorage.setItem('user_cache', JSON.stringify(verifiedUser));
      } else {
        setUser(null);
        localStorage.removeItem('user_cache');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 2. Login Logic - UPDATED FIX
  const login = async (email: string, password: string): Promise<{ success: boolean; msg?: string }> => {
    setIsLoading(true);
    try {
      // Step A: Authenticate (Sets the HttpOnly Cookie)
      const response = await authService.login({ email, password });

      if (response.success) {
        // Step B: IMMEDIATE FETCH of Profile Data
        // We do this now so the UI updates with "Captain" instead of "User" instantly.
        const fullProfile = await authService.verifySession();

        if (fullProfile) {
          setUser(fullProfile);
          localStorage.setItem('user_cache', JSON.stringify(fullProfile));
          return { success: true };
        }

        // Fallback (Should rarely happen if login succeeded)
        const fallbackUser: User = {
          id: response.data?.userId || 'unknown',
          email: email,
          name: 'User',
          role: 'designer'
        };
        setUser(fallbackUser);
        return { success: true };

      } else {
        return { success: false, msg: String(response.data?.msg || 'Login failed') };
      }
    } catch (error: any) {
      return { success: false, msg: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Logout Logic
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend to clear cookie
      await authService.logout();
    } catch (e) {
      console.error(e);
    } finally {
      // 1. Clear frontend state
      setUser(null);
      localStorage.removeItem('user_cache');

      // 2. Stop Loading
      setIsLoading(false);

      // We let the component calling logout handle the redirect
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};