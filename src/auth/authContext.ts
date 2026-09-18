// src/auth/authContext.ts
import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  displayName: string;
  role: 'admin' | 'analyst' | 'demo';
  avatarInitials: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  continueAsDemo: () => void;
  loginWithOAuth?: (provider: 'github' | 'google') => void;
  isCloudAuthAvailable?: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
