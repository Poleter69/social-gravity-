/**
 * Social Gravity — Navigation & Flow Types
 * Unified client-side routing model:
 * About Project (/) -> Login (/login) -> Main App (/dashboard)
 */

export type AppRoute = 'landing' | 'login' | 'dashboard';

export interface NavigateOptions {
  replace?: boolean;
}

export interface NavigationContextValue {
  route: AppRoute;
  path: string;
  navigate: (to: string | AppRoute, options?: NavigateOptions) => void;
  toLanding: () => void;
  toLogin: () => void;
  toDashboard: () => void;
}
