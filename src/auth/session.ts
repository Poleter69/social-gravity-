// src/auth/session.ts
import { AuthUser } from './authContext';

const SESSION_KEY = 'sg_aurora_session';

export interface StoredSession {
  user: AuthUser;
  expiresAt: number; // ms timestamp
}

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export function saveSession(user: AuthUser): void {
  const session: StoredSession = {
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
