/**
 * Social Gravity — Eclipse EmotionCapsule
 * Floating emotional intelligence pill with smooth progressive disclosure popover.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, X } from 'lucide-react';

export interface EmotionScore {
  name: string;
  score: number;
  category: 'positive' | 'negative' | 'ambiguous';
}

export interface EmotionCapsuleProps {
  dominantEmotion: string;
  dominantConfidence: number;
  emotionsList?: EmotionScore[];
  onSelectEmotion?: (emotion: string | null) => void;
  selectedEmotion?: string | null;
}

export const EmotionCapsule: React.FC<EmotionCapsuleProps> = ({
  dominantEmotion,
  dominantConfidence,
  emotionsList = [
    { name: 'fear', score: 0.38, category: 'negative' },
    { name: 'anger', score: 0.28, category: 'negative' },
    { name: 'curiosity', score: 0.16, category: 'ambiguous' },
    { name: 'approval', score: 0.10, category: 'positive' },
    { name: 'caring', score: 0.08, category: 'positive' },
  ],
  onSelectEmotion,
  selectedEmotion,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getEmotionColor = (name: string, category: string) => {
    if (category === 'positive') return '#22C55E';
    if (category === 'negative') {
      if (name === 'anger' || name === 'disgust') return '#EF4444';
      if (name === 'fear' || name === 'nervousness') return '#F59E0B';
      return '#EF4444';
    }
    return '#4F8CFF';
  };

  const primaryColor = getEmotionColor(dominantEmotion, dominantEmotion === 'approval' ? 'positive' : 'negative');

  return (
    <div className="relative">
      {/* Capsule Pill Trigger */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] shadow-lg cursor-pointer select-none"
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: primaryColor }}
        />
        <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          AFFECT:
        </span>
        <span className="text-[13px] font-semibold tracking-tight capitalize text-[var(--text)]">
          {dominantEmotion}
        </span>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
          {(dominantConfidence * 100).toFixed(0)}%
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      {/* Popover Breakdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4 shadow-2xl z-50 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#4F8CFF]" />
                <span className="text-[13px] font-medium text-[var(--text)]">
                  GoEmotions 27 Taxonomy
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-[11px] text-[var(--text-tertiary)] mb-3">
              Distribution of psychological signals across active network events.
            </p>

            {/* List of Emotions */}
            <div className="space-y-2">
              {emotionsList.map((item) => {
                const color = getEmotionColor(item.name, item.category);
                const isSelected = selectedEmotion === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (onSelectEmotion) {
                        onSelectEmotion(isSelected ? null : item.name);
                      }
                    }}
                    className={`w-full flex flex-col p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--border)] border border-[var(--border-subtle)]'
                        : 'hover:bg-[var(--border)]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="capitalize font-medium text-[var(--text)]">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        {(item.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, item.score * 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer filter status */}
            {selectedEmotion && (
              <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] text-[#4F8CFF] font-mono">
                  Filtered to {selectedEmotion}
                </span>
                <button
                  onClick={() => onSelectEmotion?.(null)}
                  className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text)] underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
