/**
 * Design tokens for the dark-first creator gallery (ember accent).
 * Single source of truth shared between Tailwind config and runtime styles.
 */
export const tokens = {
  colors: {
    canvas: '#ffffff',
    canvasParchment: '#eef0f2',
    surfaceTile1: '#0e1012',
    surfaceTile2: '#1a1d21',
    surfaceTile3: '#07080a',
    surfaceBlack: '#000000',
    ink: '#0e1012',
    inkMuted80: '#333333',
    inkMuted48: '#5c636c',
    bodyOnDark: '#ffffff',
    bodyMuted: '#cccccc',
    primary: '#ff7a45',
    primaryFocus: '#ff9466',
    primaryOnDark: '#ff7a45',
    hairline: '#dee1e5',
    dividerSoft: '#f0f0f0',
  },
  radius: {
    none: '0px',
    xs: '5px',
    sm: '8px',
    md: '11px',
    lg: '12px',
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
