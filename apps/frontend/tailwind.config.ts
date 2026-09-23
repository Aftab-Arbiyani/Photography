import type { Config } from 'tailwindcss';

/**
 * Tailwind config mapping the Apple + National Geographic design tokens.
 * Mirrors packages/ui/src/tokens.ts so utility classes stay on-system.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        parchment: '#f5f5f7',
        ink: '#1d1d1f',
        'ink-muted': '#6e6e73',
        tile: {
          1: '#272729',
          2: '#2a2a2c',
          3: '#252527',
        },
        primary: {
          DEFAULT: '#0066cc',
          focus: '#0071e3',
          'on-dark': '#2997ff',
        },
        hairline: '#e0e0e0',
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
        card: '18px',
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
      },
    },
  },
  plugins: [],
};

export default config;
