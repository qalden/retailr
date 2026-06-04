import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState component for displaying when no data is available
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data',
  description = 'There is no data to display at this time.',
  icon = '📭',
  action,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.icon} role="img" aria-label="empty state">
        {icon}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && (
        <button className={styles.actionButton} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
