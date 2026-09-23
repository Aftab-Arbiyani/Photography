import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

/** Maps the design tokens onto Ant Design's theme algorithm (light + dark). */
export function buildAntdTheme(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#0066cc',
      colorLink: isDark ? '#2997ff' : '#0066cc',
      borderRadius: 8,
      borderRadiusLG: 18,
      fontFamily: 'var(--font-text), system-ui, -apple-system, sans-serif',
      colorBgBase: isDark ? '#1d1d1f' : '#ffffff',
    },
    components: {
      Button: { borderRadius: 9999, controlHeight: 40 },
    },
  };
}
