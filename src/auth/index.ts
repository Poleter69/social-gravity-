// src/auth/index.ts — Auth module barrel
export { AuthContext, useAuth } from './authContext';
export type { AuthUser, AuthContextValue } from './authContext';
export { AuthProvider } from './AuthProvider';
export { ProtectedRoute } from './ProtectedRoute';
export { LoginPage } from './LoginPage';
export { saveSession, loadSession, clearSession } from './session';
export { validateCredentials, getDemoUser } from './credentials';
