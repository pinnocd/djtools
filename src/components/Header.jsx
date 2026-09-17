import React from 'react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="var(--accent-cyan)" strokeWidth="2" />
            <circle cx="14" cy="14" r="6" stroke="var(--accent-purple)" strokeWidth="2" />
            <circle cx="14" cy="14" r="2" fill="var(--accent-cyan)" />
            <line x1="14" y1="2" x2="14" y2="6" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>DJ Stems Studio</span>
          <span className={styles.logoTag}>Rekordbox Stem Splitter</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Web Audio API
        </div>
        <div className={styles.badge}>
          <span className={styles.badgeDot} style={{ background: 'var(--accent-purple)' }} />
          3-Stem Split
        </div>
      </nav>
    </header>
  );
}
