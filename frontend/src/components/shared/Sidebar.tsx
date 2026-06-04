import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface NavLink {
  label: string;
  path: string;
  icon?: string;
}

const navLinks: NavLink[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Products', path: '/products', icon: '📦' },
  { label: 'Orders', path: '/orders', icon: '🛒' },
  { label: 'Customers', path: '/customers', icon: '👥' },
  { label: 'Stock', path: '/stock', icon: '📦' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navLinks.map((link) => (
            <li key={link.path} className={styles.navItem}>
              <Link
                to={link.path}
                className={`${styles.navLink} ${isActive(link.path) ? styles.active : ''}`}
              >
                {link.icon && <span className={styles.icon}>{link.icon}</span>}
                <span className={styles.label}>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
