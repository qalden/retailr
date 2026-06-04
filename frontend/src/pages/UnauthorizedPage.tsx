import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => (
  <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
    <h1>403 - Unauthorized</h1>
    <p>You do not have permission to access this page.</p>
    <Link to="/dashboard">Go to Dashboard</Link>
  </main>
);

export default UnauthorizedPage;
