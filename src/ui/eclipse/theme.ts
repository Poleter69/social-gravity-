/**
 * Social Gravity — Project Eclipse Design Tokens
 * "If Apple designed Palantir Foundry"
 * 
 * Strict 8pt spacing system, 100vh constraint, refined typography,
 * and deliberate, organic Framer Motion transitions.
 */

export const ECLIPSE_THEME = {
  colors: {
    bg: '#09090B',
    surface: '#111114',
    elevated: '#18181B',
    border: '#27272A',
    borderSubtle: '#1F1F23',
    primary: '#4F8CFF',
    primaryHover: '#3B79F0',
    primaryGlow: 'rgba(79, 140, 255, 0.18)',
    success: '#22C55E',
    successGlow: 'rgba(34, 197, 94, 0.16)',
    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.16)',
    critical: '#EF4444',
    criticalGlow: 'rgba(239, 68, 68, 0.18)',
    neutral: '#71717A',
    muted: '#A1A1AA',
    text: '#FAFAFA',
    textSecondary: '#D4D4D8',
    textTertiary: '#71717A',
  },
  typography: {
    hero: 'text-[36px] leading-[44px] font-semibold tracking-[-0.03em]',
    pageTitle: 'text-[28px] leading-[34px] font-semibold tracking-[-0.02em]',
    section: 'text-[20px] leading-[26px] font-semibold tracking-[-0.01em]',
    cardNumber: 'text-[24px] leading-[30px] font-semibold tracking-[-0.02em]',
    body: 'text-[15px] leading-[22px] font-normal tracking-[-0.005em]',
    caption: 'text-[13px] leading-[18px] font-medium tracking-[0.01em]',
    micro: 'text-[11px] leading-[14px] font-mono uppercase tracking-[0.04em]',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  transitions: {
    hover: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
    press: { duration: 0.12, ease: 'easeOut' },
    drawer: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
    sidebar: { duration: 0.24, ease: [0.25, 1, 0.5, 1] },
    modal: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
    replay: { duration: 0.30, ease: 'easeInOut' },
  },
  budget: {
    maxMetricCards: 4,
    maxFeedItems: 5,
    maxAlertCards: 2,
    maxFloatingOverlays: 1,
    maxSidebarItems: 6,
  }
} as const;
