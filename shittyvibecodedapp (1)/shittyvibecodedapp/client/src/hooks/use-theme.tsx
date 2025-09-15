import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  // Default to dark theme
  const [theme, setTheme] = useState<Theme>('dark');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
      setTheme(storedTheme);
    } else {
      // Default to dark theme if no stored theme
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  // Apply theme class to document and sync with localStorage
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class (only add 'light' class, dark is default)
    if (theme === 'light') {
      root.classList.add('light');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
}