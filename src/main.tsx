import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import './index.css';
import App from './App.tsx';
import { useThemeStore } from '@/store/theme';
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler';

function ThemedApp() {
  const isDark = useThemeStore((s) => s.isDark);
  useGlobalErrorHandler();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: '#4a6cf7', borderRadius: 8 },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>,
);