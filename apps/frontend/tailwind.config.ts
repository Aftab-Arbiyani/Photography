import type { Config } from 'tailwindcss';

/**
 * Tailwind config for the dark-first creator-gallery design tokens.
 * Mirrors packages/ui/src/tokens.ts so utility classes stay on-system.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware page background; channel form so `bg-background/90` works.
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        canvas: '#ffffff',
        parchment: '#eef0f2',
        // Theme-aware: flip to light values under `.dark` (see globals.css), so
        // every `text-ink` / `text-ink-muted` / `border-hairline` reads in dark mode.
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        // Always-dark ink, for type sitting on a surface that stays white in dark mode.
        'ink-fixed': '#0e1012',
        // Dark surfaces: 1 = page, 2 = raised card/panel, 3 = deepest (footer, stage).
        tile: {
          1: '#0e1012',
          2: '#1a1d21',
          3: '#07080a',
        },
        // Signature ember. Solid fills take dark text (`text-ink-fixed`), never white.
        primary: {
          DEFAULT: '#ff7a45',
          focus: '#ff9466',
          'on-dark': '#ff7a45',
        },
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
      },
      // Accent text deepens on light backgrounds so it keeps AA contrast; the
      // `bg-primary` fill stays the bright ember in both themes.
      textColor: {
        primary: {
          DEFAULT: 'rgb(var(--primary-text) / <alpha-value>)',
          focus: 'rgb(var(--primary-text-focus) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', '-apple-system', 'sans-serif'],
        text: ['var(--font-text)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        hero: ['56px', { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '1.1', fontWeight: '600' }],
        lead: ['28px', { lineHeight: '1.14' }],
        tagline: ['21px', { lineHeight: '1.19', fontWeight: '600' }],
      },
      borderRadius: {
        pill: '9999px',
        card: '12px',
      },
      boxShadow: {
        product: '3px 5px 30px 0px rgba(0, 0, 0, 0.22)',
      },
      maxWidth: {
        content: '980px',
        wide: '1440px',
      },
      spacing: {
        section: '96px',
        'section-lg': '140px',
      },
      keyframes: {
        // Slow drift across a hero frame while it is the active slide.
        'ken-burns': {
          '0%': { transform: 'scale(1.06) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.18) translate3d(-1.5%, -1.5%, 0)' },
        },
        // Track holds the tiles twice, so -50% is one seamless lap.
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translate3d(-50%, 0, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        // Hero photo wall: each column holds its tiles twice, so -50% is one lap.
        'wall-up': {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, -50%, 0)' },
        },
        'wall-down': {
          '0%': { transform: 'translate3d(0, -50%, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        // Hero entrance. CSS rather than JS so the copy is painted, not hidden.
        rise: {
          '0%': { opacity: '0', transform: 'translate3d(0, 22px, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rise: 'rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'ken-burns': 'ken-burns 9s ease-out forwards',
        marquee: 'marquee 70s linear infinite',
        'marquee-reverse': 'marquee-reverse 85s linear infinite',
        'wall-up': 'wall-up var(--wall-duration, 90s) linear infinite',
        'wall-down': 'wall-down var(--wall-duration, 90s) linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
