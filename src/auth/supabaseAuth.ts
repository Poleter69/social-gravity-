/**
 * Social Gravity — Zero-Cost Supabase Auth & OAuth Integration
 * Supports GitHub OAuth, Google OAuth, and passwordless authentication
 * with zero paid identity providers (Supabase Free Tier provides 50,000 MAU free).
 */

import { AuthUser } from './authContext';

export class SupabaseAuthService {
  private static instance: SupabaseAuthService | null = null;
  private supabaseUrl: string | null = null;
  private supabaseAnonKey: string | null = null;

  private constructor() {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      this.supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || null;
      this.supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || null;
    }
  }

  public static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  public isAvailable(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  }

  /**
   * Triggers GitHub or Google OAuth flow using Supabase Free Tier.
   */
  public initiateOAuth(provider: 'github' | 'google'): void {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('[SupabaseAuth] Missing VITE_SUPABASE_URL; OAuth unavailable');
      return;
    }
    if (typeof window === 'undefined') return;

    const redirectTo = encodeURIComponent(window.location.origin);
    const authUrl = `${this.supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectTo}`;
    window.location.href = authUrl;
  }

  /**
   * Inspects URL hash for incoming OAuth access tokens (#access_token=...).
   */
  public parseOAuthCallback(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return null;

    try {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      if (!accessToken) return null;

      // Clean hash from URL for safety
      window.history.replaceState(null, '', window.location.pathname);

      // Parse JWT payload claims
      const parts = accessToken.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const email = payload.email || 'researcher@github.auth';
        const name = payload.user_metadata?.full_name || payload.user_metadata?.user_name || email.split('@')[0];
        const initials = name.slice(0, 2).toUpperCase();

        return {
          id: payload.sub || `usr-${Date.now()}`,
          displayName: name,
          role: 'analyst',
          avatarInitials: initials,
        };
      }
    } catch (e) {
      console.error('[SupabaseAuth] Failed to parse OAuth hash:', e);
    }
    return null;
  }
}

export const getSupabaseAuth = (): SupabaseAuthService => SupabaseAuthService.getInstance();
