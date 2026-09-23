/**
 * Design tokens distilled from the Apple + National Geographic reference system.
 * Single source of truth shared between Tailwind config and runtime styles.
 */
export const tokens = {
  colors: {
    canvas: '#ffffff',
    canvasParchment: '#f5f5f7',
    surfaceTile1: '#272729',
    surfaceTile2: '#2a2a2c',
    surfaceTile3: '#252527',
    surfaceBlack: '#000000',
    ink: '#1d1d1f',
    inkMuted80: '#333333',
    inkMuted48: '#7a7a7a',
    bodyOnDark: '#ffffff',
    bodyMuted: '#cccccc',
    primary: '#0066cc',
    primaryFocus: '#0071e3',
    primaryOnDark: '#2997ff',
    hairline: '#e0e0e0',
    dividerSoft: '#f0f0f0',
  },
  radius: {
    none: '0px',
    xs: '5px',
    sm: '8px',
    md: '11px',
    lg: '18px',
    pill: '9999px',
  },
  shadow: {
    product: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
  },
  spacing: {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '17px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    section: '80px',
  },
} as const;

export type DesignTokens = typeof tokens;
