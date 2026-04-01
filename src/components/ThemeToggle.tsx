'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      // Intentionally don't set data-theme here, CSS media query handles the fallback automatically
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!theme) return null; // Avoid hydration mismatch jumping

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'none',
        border: '1px solid var(--border-color)',
        color: 'var(--text-color)',
        padding: '0.4rem 0.8rem',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderRadius: '4px',
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--text-color)'; e.currentTarget.style.color = 'var(--bg-color)'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-color)'; }}
    >
      SWITCH TO {theme === 'light' ? 'DARK' : 'LIGHT'}
    </button>
  );
}
