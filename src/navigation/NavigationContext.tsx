/**
 * Social Gravity — Project Aurora: Navigation Router
 * Universal client-side router supporting HTML5 History & Hash routing.
 * Enforces the flow: About Project (/) -> Login (/login) -> Main App (/dashboard).
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppRoute, NavigateOptions, NavigationContextValue } from './types';

export const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Normalizes input paths/routes to a canonical AppRoute and browser path.
 */
export function resolveRoute(input: string | AppRoute): { route: AppRoute; path: string } {
  const clean = input.trim().toLowerCase();

  // Hash-based or path-based detection
  if (
    clean === 'login' ||
    clean === '/login' ||
    clean === '#/login' ||
    clean.includes('/login')
  ) {
    return { route: 'login', path: '/login' };
  }

  if (
    clean === 'dashboard' ||
    clean === '/dashboard' ||
    clean === '#/dashboard' ||
    clean === 'app' ||
    clean === '/app' ||
    clean === '#/app' ||
    clean.includes('/dashboard') ||
    clean.includes('/app')
  ) {
    return { route: 'dashboard', path: '/dashboard' };
  }

  // Default: Landing ("About Project")
  return { route: 'landing', path: '/' };
}

/**
 * Resolves current route from window.location (checking hash and pathname).
 */
export function getRouteFromBrowserLocation(): { route: AppRoute; path: string } {
  if (typeof window === 'undefined') {
    return { route: 'landing', path: '/' };
  }

  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    const hashRoute = resolveRoute(hash);
    if (hashRoute.route !== 'landing' || hash.includes('landing') || hash.includes('about')) {
      return hashRoute;
    }
  }

  const pathname = window.location.pathname;
  return resolveRoute(pathname);
}

export const NavigationProvider: React.FC<{ children: React.ReactNode; initialRoute?: AppRoute }> = ({
  children,
  initialRoute,
}) => {
  const [current, setCurrent] = useState<{ route: AppRoute; path: string }>(() => {
    if (initialRoute) {
      return resolveRoute(initialRoute);
    }
    return getRouteFromBrowserLocation();
  });

  const navigate = useCallback((to: string | AppRoute, options?: NavigateOptions) => {
    const next = resolveRoute(to);

    if (typeof window !== 'undefined') {
      try {
        const useHash = window.location.hash.startsWith('#/');
        const targetUrl = useHash ? `#${next.path}` : next.path;

        if (options?.replace) {
          window.history.replaceState({ route: next.route, path: next.path }, '', targetUrl);
        } else {
          window.history.pushState({ route: next.route, path: next.path }, '', targetUrl);
        }
      } catch {
        // Fallback for sandboxed or restricted iframes
      }
    }

    setCurrent(next);
  }, []);

  const toLanding = useCallback(() => navigate('landing'), [navigate]);
  const toLogin = useCallback(() => navigate('login'), [navigate]);
  const toDashboard = useCallback(() => navigate('dashboard'), [navigate]);

  // Synchronize browser Back and Forward navigation buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const next = getRouteFromBrowserLocation();
      setCurrent(next);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        route: current.route,
        path: current.path,
        navigate,
        toLanding,
        toLogin,
        toDashboard,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}
