import React, { type ReactNode } from 'react';
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { connected, connecting, error } = useWebSocketConnection();

  let statusColor = 'var(--color-error)';
  let statusLabel = 'Offline';

  if (error) {
    statusColor = 'var(--color-error)';
    statusLabel = 'Error';
  } else if (connecting) {
    statusColor = 'var(--color-warning)';
    statusLabel = 'Connecting...';
  } else if (connected) {
    statusColor = 'var(--color-success)';
    statusLabel = 'Live';
  }

  return (
    <div className={styles.layoutContainer}>
      <Header />
      <div className={styles.connectionStatus} style={{ backgroundColor: statusColor }}>
        <span className={styles.statusDot}></span>
        <span className={styles.statusText}>{statusLabel}</span>
      </div>
      <div className={styles.layoutBody}>
        <Sidebar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
