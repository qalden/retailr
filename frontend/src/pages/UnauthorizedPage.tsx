import React from 'react';
import { Link } from 'react-router-dom';
import styles from './UnauthorizedPage.module.css';

const UnauthorizedPage: React.FC = () => (
  <main className={styles.container}>
    <div className={styles.content}>
      <div className={styles.icon}>⛔</div>
      <h1 className={styles.statusCode}>403</h1>
      <h2 className={styles.title}>Access Denied</h2>
      <p className={styles.message}>
        You do not have permission to access this page. If you believe this is an error, please contact an administrator.
      </p>
      <Link to="/dashboard" className={styles.link}>
        Go to Dashboard
      </Link>
    </div>
  </main>
);

export default UnauthorizedPage;
