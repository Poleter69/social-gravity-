/**
 * Social Gravity — Project Aurora
 * ThemeContext: Light / Dark theme switching with CSS variable injection.
 * Uses class-based Tailwind darkMode + CSS custom properties for instant swaps.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppTheme = 'dark' | 'light';

export interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'sg_aurora_theme';

// ─── CSS Variable Maps ────────────────────────────────────────────────────────

export const DARK_VARS: Record<string, string> = {
  '--bg': '#09090B',
  '--surface': '#111114',
  '--surface-elevated': '#18181B',
  '--surface-secondary': '#18181B',
  '--border': '#27272A',
  '--border-subtle': '#1F1F23',
  '--text': '#FAFAFA',
  '--text-secondary': '#D4D4D8',
  '--text-muted': '#A1A1AA',
  '--text-tertiary': '#71717A',
  '--primary': '#4F8CFF',
  '--primary-hover': '#3B79F0',
  '--primary-glow': 'rgba(79,140,255,0.18)',
  '--success': '#22C55E',
  '--success-glow': 'rgba(34,197,94,0.16)',
  '--warning': '#F59E0B',
  '--critical': '#EF4444',
  '--card-shadow': '0 1px 4px rgba(0,0,0,0.4)',
  '--card-shadow-hover': '0 4px 20px rgba(0,0,0,0.5)',
  '--scrollbar-track': '#0a0f1d',
  '--scrollbar-thumb': '#1e2d50',
  '--scrollbar-thumb-hover': '#00f0ff',
  '--canvas-bg': '#06080F',
  '--grid-dot': 'rgba(255, 255, 255, 0.035)',
  '--grid-crosshair': 'rgba(255, 255, 255, 0.05)',
  '--edge-base': 'rgba(148, 163, 184, 0.22)',
  '--node-glow-intensity': '1',
};

export const LIGHT_VARS: Record<string, string> = {
  '--bg': '#F8FAFC',
  '--surface': '#FFFFFF',
  '--surface-elevated': '#F1F5F9',
  '--surface-secondary': '#F1F5F9',
  '--border': '#E2E8F0',
  '--border-subtle': '#EEF2F7',
  '--text': '#0F172A',
  '--text-secondary': '#334155',
  '--text-muted': '#64748B',
  '--text-tertiary': '#94A3B8',
  '--primary': '#2563EB',
  '--primary-hover': '#1D4ED8',
  '--primary-glow': 'rgba(37,99,235,0.12)',
  '--success': '#16A34A',
  '--success-glow': 'rgba(22,163,74,0.12)',
  '--warning': '#D97706',
  '--critical': '#DC2626',
  '--card-shadow': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  '--card-shadow-hover': '0 8px 24px rgba(0,0,0,0.10)',
  '--scrollbar-track': '#F1F5F9',
  '--scrollbar-thumb': '#CBD5E1',
  '--scrollbar-thumb-hover': '#2563EB',
  '--canvas-bg': '#F8FAFC',
  '--grid-dot': 'rgba(15, 23, 42, 0.06)',
  '--grid-crosshair': 'rgba(15, 23, 42, 0.08)',
  '--edge-base': 'rgba(100, 116, 139, 0.38)',
  '--node-glow-intensity': '0.5',
};

function applyVars(vars: Record<string, string>): void {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const applyTheme = useCallback((t: AppTheme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light-theme');
      applyVars(DARK_VARS);
    } else {
      root.classList.remove('dark');
      root.classList.add('light-theme');
      applyVars(LIGHT_VARS);
    }
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
