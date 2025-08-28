/**
 * Theme Context - Uygulamanın tema yönetimi
 * Karanlık/açık mod değişikliği için
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { lightTheme, darkTheme, type Theme } from './theme';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  isDarkMode,
  onThemeToggle,
}) => {
  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    onThemeToggle(!isDarkMode);
  };

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
