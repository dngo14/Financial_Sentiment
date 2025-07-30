'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get initial theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme === 'dark' || savedTheme === 'light' 
      ? savedTheme 
      : systemPrefersDark 
        ? 'dark' 
        : 'light';
    
    setTheme(initialTheme);
    
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Clear all theme classes first
    root.classList.remove('dark', 'light');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    
    localStorage.setItem('theme', theme);
    
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}