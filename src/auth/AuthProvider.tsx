/**
 * Social Gravity — Project Aurora
 * AuthProvider: Root authentication context with session restoration,
 * 8-hour persistence, and graceful loading state.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext, AuthUser } from './authContext';
import { saveSession, loadSession, clearSession } from './session';
import { validateCredentials, getDemoUser } from './credentials';
import { getSupabaseAuth } from './supabaseAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount or check incoming OAuth token
  useEffect(() => {
    // 1. Check OAuth callback
    const oauthUser = getSupabaseAuth().parseOAuthCallback();
    if (oauthUser) {
      setUser(oauthUser);
      saveSession(oauthUser);
      setIsLoading(false);
      return;
    }

    // 2. Check local session
    const restored = loadSession();
    if (restored) {
      setUser(restored);
    }
    // Small delay to prevent flash
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(async (userId: string, password: string) => {
    // Simulate async auth (replace with real API call in production)
    await new Promise((r) => setTimeout(r, 800));
    const result = validateCredentials(userId, password);
    if (result.success) {
      setUser(result.user);
      saveSession(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, []);

  const continueAsDemo = useCallback(() => {
    const demoUser = getDemoUser();
    setUser(demoUser);
    saveSession(demoUser);
  }, []);

  const loginWithOAuth = useCallback((provider: 'github' | 'google') => {
    getSupabaseAuth().initiateOAuth(provider);
  }, []);

  const isCloudAuthAvailable = getSupabaseAuth().isAvailable();

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        continueAsDemo,
        loginWithOAuth,
        isCloudAuthAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
