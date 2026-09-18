/**
 * Social Gravity — Project Aurora: Onboarding Context
 * Manages the post-login product reveal landing page state and user preferences.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SKIP_LANDING_KEY = 'sg_skip_aurora_landing';

export interface OnboardingContextValue {
  showLanding: boolean;
  skipLandingNextTime: boolean;
  setSkipLandingNextTime: (skip: boolean) => void;
  completeLanding: () => void;
  reopenLanding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [skipLandingNextTime, setSkipLandingNextTimeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SKIP_LANDING_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // If user previously chose to skip, don't show landing; otherwise show on post-login
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      const skipped = localStorage.getItem(SKIP_LANDING_KEY) === 'true';
      return !skipped;
    } catch {
      return true;
    }
  });

  const setSkipLandingNextTime = useCallback((skip: boolean) => {
    setSkipLandingNextTimeState(skip);
    try {
      if (skip) {
        localStorage.setItem(SKIP_LANDING_KEY, 'true');
      } else {
        localStorage.removeItem(SKIP_LANDING_KEY);
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const completeLanding = useCallback(() => {
    setShowLanding(false);
  }, []);

  const reopenLanding = useCallback(() => {
    setShowLanding(true);
  }, []);

  useEffect(() => {
    // Keep localStorage in sync if changed
    try {
      if (skipLandingNextTime) {
        localStorage.setItem(SKIP_LANDING_KEY, 'true');
      }
    } catch {
      // ignore
    }
  }, [skipLandingNextTime]);

  return (
    <OnboardingContext.Provider
      value={{
        showLanding,
        skipLandingNextTime,
        setSkipLandingNextTime,
        completeLanding,
        reopenLanding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
