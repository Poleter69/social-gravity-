/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gravity: {
          950: '#060911',
          900: '#0a0f1d',
          850: '#0f1629',
          800: '#141e36',
          700: '#1e2d50',
          600: '#2b3f6c',
          500: '#3d5895',
          accent: '#00f0ff',
          neonGreen: '#10b981',
          neonAmber: '#f59e0b',
          neonRose: '#f43f5e',
          neonPurple: '#8b5cf6',
        },
        eclipse: {
          bg: '#09090B',
          surface: '#111114',
          elevated: '#18181B',
          border: '#27272A',
          primary: '#4F8CFF',
          success: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
          neutral: '#71717A',
          muted: '#A1A1AA',
          text: '#FAFAFA',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.35)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.35)',
      },
    },
  },
  plugins: [],
};
