import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with a default user to bypass login
  const [user, setUser] = useState<User | null>({
    id: 'guest-user-123',
    name: 'Guest Designer',
    email: 'guest@signcraft.com'
  });

  const login = (email: string, name: string) => {
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
    });
  };

  const logout = () => {
    // Optional: Reset to guest or null. 
    // For this use case, we might just want to keep them as guest or actually log out.
    setUser(null);
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