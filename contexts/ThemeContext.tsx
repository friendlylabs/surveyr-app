import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

interface ThemeContextType {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  colors: Colors;
  styles: any;
}

interface Colors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  
  // UI colors
  primary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  
  // Special colors
  overlay: string;
  shadow: string;
}

const lightColors: Colors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  primary: '#10B981',
  border: '#e5e7eb',
  success: '#10B981',
  error: '#ef4444',
  warning: '#f59e0b',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkColors: Colors = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  primary: '#10B981',
  border: '#374151',
  success: '#10B981',
  error: '#ef4444',
  warning: '#f59e0b',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkTheme(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = !isDarkTheme;
      setIsDarkTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [isDarkTheme]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const colors = isDarkTheme ? darkColors : lightColors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    text: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
    border: {
      borderColor: colors.border,
    },
    primary: {
      color: colors.primary,
    },
  });

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme, colors, styles }}>
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
