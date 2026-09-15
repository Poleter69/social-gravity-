/**
 * Social Gravity - Keyboard Shortcuts Hook
 * Registers global keyboard shortcuts for analyst workflows.
 */

import { useEffect } from 'react';

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]): void {
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      // Do not trigger when typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      for (const s of shortcuts) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase() || e.code === s.key;
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : true;
        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
