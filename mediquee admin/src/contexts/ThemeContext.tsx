import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Always default to light mode unless the user explicitly chose dark mode in Settings
    const isExplicit = localStorage.getItem('theme_explicit') === '1';
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (isExplicit && (savedTheme === 'light' || savedTheme === 'dark')) return savedTheme;
    return 'light';
  });

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    root.setAttribute('data-theme', t);
    root.style.colorScheme = t;
    localStorage.setItem('theme', t);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme_explicit', '1');
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme_explicit', '1');
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
