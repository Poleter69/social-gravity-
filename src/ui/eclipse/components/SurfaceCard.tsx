/**
 * Social Gravity — Project Aurora
 * SurfaceCard: Standardized card primitive honoring active theme tokens.
 * Variants: default | elevated | glass | critical | success | warning
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type SurfaceCardVariant = 'default' | 'elevated' | 'glass' | 'critical' | 'success' | 'warning';

export interface SurfaceCardProps extends HTMLMotionProps<'div'> {
  variant?: SurfaceCardVariant;
  interactive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({
  variant = 'default',
  interactive = false,
  className = '',
  children,
  style,
  ...props
}) => {
  const getVariantStyles = (): { bg: string; border: string; color: string; shadow?: string } => {
    switch (variant) {
      case 'elevated':
        return {
          bg: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          shadow: 'var(--card-shadow)',
        };
      case 'glass':
        return {
          bg: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          shadow: 'var(--card-shadow)',
        };
      case 'critical':
        return {
          bg: 'var(--surface)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: 'var(--text)',
          shadow: '0 0 16px rgba(239, 68, 68, 0.1)',
        };
      case 'success':
        return {
          bg: 'var(--surface)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          color: 'var(--text)',
          shadow: '0 0 16px rgba(34, 197, 94, 0.1)',
        };
      case 'warning':
        return {
          bg: 'var(--surface)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: 'var(--text)',
          shadow: '0 0 16px rgba(245, 158, 11, 0.1)',
        };
      case 'default':
      default:
        return {
          bg: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          shadow: 'var(--card-shadow)',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.01, borderColor: 'var(--primary)' } : undefined}
      transition={{ duration: 0.15 }}
      style={{
        background: vStyles.bg,
        border: vStyles.border,
        color: vStyles.color,
        boxShadow: vStyles.shadow,
        ...style,
      }}
      className={`rounded-2xl transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
