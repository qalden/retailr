import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <h1 className={styles.logo}>Retailr</h1>
        </div>

        <div className={styles.rightSection}>
          {/* Desktop user menu */}
          <div className={styles.userMenu}>
            {user && (
              <>
                <span className={styles.userName}>{user.name}</span>
                <button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger - placeholder for future mobile nav */}
          <button
            className={styles.hamburger}
            aria-label="Toggle navigation menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
