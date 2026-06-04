import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Skeleton component for loading states
 * Displays a placeholder while content is loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
};

export default Skeleton;
