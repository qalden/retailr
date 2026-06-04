import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  alertCount: number;
  onClose?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alertCount, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || alertCount === 0) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m0-12a2 2 0 10-4 0 2 2 0 004 0zm0 0a2 2 0 10-4 0 2 2 0 004 0zm0 0a2 2 0 10-4 0 2 2 0 004 0z" />
          </svg>
        </div>

        <div className={styles.message}>
          <span className={styles.title}>
            {alertCount === 1 ? '1 Low Stock Alert' : `${alertCount} Low Stock Alerts`}
          </span>
          <span className={styles.description}>Review and acknowledge alerts</span>
        </div>

        <Link to="/stock/alerts" className={styles.link}>
          View Alerts
        </Link>
      </div>

      <button className={styles.closeButton} onClick={handleClose} aria-label="Close alert banner" type="button">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default AlertBanner;
