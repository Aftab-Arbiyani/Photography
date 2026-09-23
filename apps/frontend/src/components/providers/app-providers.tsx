'use client';

// Makes antd v5 fully compatible with React 19 (Next.js 15's default React).
// Must be imported before antd renders any wave/message/modal/notification.
import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';

/** Composes all client providers used across the app. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </AntdRegistry>
  );
}
