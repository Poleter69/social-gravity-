// src/auth/credentials.ts
import { AuthUser } from './authContext';

interface Credential {
  password: string;
  user: AuthUser;
}

// Development credentials — replace with server auth in production
const CREDENTIALS: Record<string, Credential> = {
  admin: {
    password: 'socialgravity',
    user: {
      id: 'usr_admin_001',
      displayName: 'System Administrator',
      role: 'admin',
      avatarInitials: 'SA',
    },
  },
  analyst: {
    password: 'analyst2024',
    user: {
      id: 'usr_analyst_001',
      displayName: 'Intelligence Analyst',
      role: 'analyst',
      avatarInitials: 'IA',
    },
  },
  demo: {
    password: 'demo',
    user: {
      id: 'usr_demo_001',
      displayName: 'Demo User',
      role: 'demo',
      avatarInitials: 'DU',
    },
  },
};

const DEMO_USER: AuthUser = {
  id: 'usr_demo_guest',
  displayName: 'Guest Analyst',
  role: 'demo',
  avatarInitials: 'GA',
};

export function validateCredentials(
  userId: string,
  password: string
): { success: true; user: AuthUser } | { success: false; error: string } {
  const cred = CREDENTIALS[userId.toLowerCase()];
  if (!cred) {
    return { success: false, error: 'User ID not found. Check your credentials.' };
  }
  if (cred.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
  return { success: true, user: cred.user };
}

export function getDemoUser(): AuthUser {
  return DEMO_USER;
}
