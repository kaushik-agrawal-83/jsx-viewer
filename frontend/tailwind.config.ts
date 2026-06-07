import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#080810',
        surface: {
          DEFAULT: '#0f0f1c',
          raised: '#141428',
        },
        primary: {
          DEFAULT: '#818cf8',
          dark: '#6366f1',
          glow: 'rgba(129,140,248,0.15)',
          ring: 'rgba(129,140,248,0.35)',
        },
        accent: {
          DEFAULT: '#f97316',
          glow: 'rgba(249,115,22,0.15)',
        },
        success: {
          DEFAULT: '#4ade80',
          glow: 'rgba(74,222,128,0.20)',
        },
        error: {
          DEFAULT: '#f87171',
          glow: 'rgba(248,113,113,0.20)',
          subtle: 'rgba(248,113,113,0.10)',
        },
        warning: '#fb923c',
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
          mono: '#a5b4fc',
        },
      },
      backdropBlur: {
        xs: '4px',
        glass: '24px',
      },
      boxShadow: {
        'dot-primary': '0 0 6px rgba(129,140,248,0.50)',
        'dot-success':  '0 0 6px rgba(74,222,128,0.40)',
        'dot-error':    '0 0 6px rgba(248,113,113,0.40)',
        'xl-dark':      '0 24px 60px rgba(0,0,0,0.70)',
        'menu':         '0 8px 32px rgba(0,0,0,0.60)',
      },
      keyframes: {
        'dot-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'dot-pulse-slow': 'dot-pulse 2s ease-in-out infinite',
        'dot-pulse-fast': 'dot-pulse 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
