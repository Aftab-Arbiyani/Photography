'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import { buildAntdTheme } from '@/lib/theme';

type Mode = 'light' | 'dark';

interface ThemeContextValue {
  mode: Mode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'dark', toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

/** Client theme provider: persists dark/light mode and feeds AntD + the `dark` class. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark-first: the gallery is designed around a dark stage; light is opt-in.
  // Starts dark on both server and client so hydration matches. A stored light
  // choice is already on <html> before paint (script in layout.tsx); antd's
  // components pick it up in the effect below.
  const [mode, setMode] = useState<Mode>('dark');
  // Don't write the class/storage until the stored choice has been read, or the
  // first pass would briefly force dark back on for light-mode viewers.
  const [ready, setReady] = useState(false);

  // Hydrate an explicit choice from storage once mounted.
  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') setMode(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle('dark', mode === 'dark');
    window.localStorage.setItem('theme', mode);
  }, [mode, ready]);

  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={buildAntdTheme(mode === 'dark')}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
