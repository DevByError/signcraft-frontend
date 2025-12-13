import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with localStorage data if available
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('signcraft_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          id: 'guest-user-123',
          name: 'Guest Designer',
          email: 'guest@signcraft.com'
        };
      }
    }
    return {
      id: 'guest-user-123',
      name: 'Guest Designer',
      email: 'guest@signcraft.com'
    };
  });

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('signcraft_user', JSON.stringify(user));
    }
  }, [user]);

  const login = (email: string, name: string) => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser({
      id: 'guest-user-123',
      name: 'Guest Designer',
      email: 'guest@signcraft.com'
    });
    localStorage.removeItem('signcraft_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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