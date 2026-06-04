import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name ?? 'User'}!</p>
      <button type="button" onClick={logout}>Sign out</button>
    </main>
  );
};

export default DashboardPage;
