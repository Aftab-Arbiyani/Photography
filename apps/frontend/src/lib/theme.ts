import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

/** Maps the design tokens onto Ant Design's theme algorithm (light + dark). */
export function buildAntdTheme(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#ff7a45' : '#c2410c',
      colorLink: isDark ? '#ff7a45' : '#c2410c',
      borderRadius: 8,
      borderRadiusLG: 12,
      fontFamily: 'var(--font-text), system-ui, -apple-system, sans-serif',
      colorBgBase: isDark ? '#0e1012' : '#ffffff',
      ...(isDark && { colorBgContainer: '#1a1d21', colorBgElevated: '#1f2328' }),
      // antd's default hint greys (45% alpha) fall below AA in both themes.
      colorTextDescription: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
      colorTextTertiary: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
      ...(isDark && { colorTextPlaceholder: 'rgba(255, 255, 255, 0.5)' }),
    },
    components: {
      // Bright ember fills need dark labels in dark mode; white fails contrast.
      Button: {
        borderRadius: 9999,
        controlHeight: 40,
        fontWeight: 600,
        ...(isDark && { primaryColor: '#0e1012' }),
      },
    },
  };
}
