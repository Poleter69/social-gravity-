/**
 * Social Gravity — Project Aurora
 * ProtectedRoute: Blocks unauthenticated access to protected workspaces.
 * Redirects to login, restores session, shows loading screen.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useAuth } from './authContext';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRedirect?: () => void;
}

export const SessionLoader: React.FC = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg)] select-none">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6"
    >
      {/* Animated logo */}
      <motion.div
        animate={{ boxShadow: ['0 0 20px rgba(79,140,255,0.2)', '0 0 40px rgba(79,140,255,0.5)', '0 0 20px rgba(79,140,255,0.2)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center"
      >
        <Activity className="w-8 h-8 text-[#4F8CFF]" />
      </motion.div>

      <div className="text-center">
        <div className="text-[13px] font-mono uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1">
          Social Gravity
        </div>
        <div className="text-[11px] font-mono tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Checking Session...
          </motion.span>
        </div>
      </div>
    </motion.div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback, onRedirect }) => {
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && onRedirect) {
      onRedirect();
    }
  }, [isLoading, isAuthenticated, onRedirect]);

  if (isLoading) {
    return <SessionLoader />;
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
