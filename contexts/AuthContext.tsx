import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; msg?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with null - user will be fetched from backend if needed
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<{ success: boolean; msg?: string }> => {
    setIsLoading(true);
    console.log('🔑 [AUTH_CONTEXT] Login attempt for:', email);

    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        // Decode JWT token to extract user info
        if (response.data.authtoken) {
          try {
            const tokenPayload = JSON.parse(atob(response.data.authtoken.split('.')[1]));
            console.log('🔓 [AUTH_CONTEXT] Token decoded:', {
              userId: tokenPayload.userId,
              email: tokenPayload.email,
              username: tokenPayload.username,
              role: tokenPayload.role
            });

            const newUser: User = {
              id: tokenPayload.userId || 'unknown',
              email: tokenPayload.email || email,
              name: tokenPayload.username || 'User',
            };
            setUser(newUser);
            console.log('✅ [AUTH_CONTEXT] User authenticated:', newUser);
          } catch (decodeError) {
            console.error('❌ [AUTH_CONTEXT] Failed to decode token:', decodeError);
            // Fallback user object
            setUser({
              id: response.data.userId || 'unknown',
              email: response.data.email || email,
              name: response.data.username || 'User',
            });
          }
        }

        return { success: true };
      } else {
        const errorMsg = typeof response.data?.msg === 'string'
          ? response.data.msg
          : Array.isArray(response.data?.msg)
            ? response.data.msg.join(', ')
            : 'Login failed';
        console.error('❌ [AUTH_CONTEXT] Login failed:', errorMsg);
        return { success: false, msg: errorMsg };
      }
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Exception during login:', error);
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Login failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
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