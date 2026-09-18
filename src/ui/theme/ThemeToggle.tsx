/**
 * Social Gravity — Project Aurora
 * ThemeToggle: Animated Sun/Moon toggle button for the CommandBar.
 * Smooth icon rotation, background interpolation, instant swap.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92, rotate: 15 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="relative w-8 h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Moon className="w-4 h-4" style={{ color: '#A1A1AA' }} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -30, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sun className="w-4 h-4 text-[#F59E0B]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
