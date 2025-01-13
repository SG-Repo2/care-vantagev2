import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { customLightTheme, customDarkTheme, AppTheme } from '../theme';
import { Logger } from '../utils/error/Logger';
interface AppContextType {
  theme: AppTheme;
  isDarkMode: boolean;
  isLoading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [theme, setTheme] = useState(isDarkMode ? customDarkTheme : customLightTheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Defer initialization to next frame to avoid blocking UI
      requestAnimationFrame(async () => {
        try {
          const savedTheme = await AsyncStorage.getItem('theme');
          if (savedTheme) {
            // Ensure state updates happen in next frame
            requestAnimationFrame(() => {
              setIsDarkMode(savedTheme === 'dark');
              setTheme(savedTheme === 'dark' ? customDarkTheme : customLightTheme);
            });
          }
        } catch (error) {
          Logger.error('Failed to initialize app theme:', { error });
          // Still set theme to system default if loading fails
          setTheme(colorScheme === 'dark' ? customDarkTheme : customLightTheme);
        } finally {
          setIsLoading(false);
        }
      });
    };

    initializeApp();
  }, []);

  useEffect(() => {
    setTheme(isDarkMode ? customDarkTheme : customLightTheme);
  }, [isDarkMode]);

  const toggleTheme = async () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    setTheme(newIsDarkMode ? customDarkTheme : customLightTheme);
    
    // Defer storage operation to next frame
    requestAnimationFrame(async () => {
      try {
        await AsyncStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
      } catch (error) {
        Logger.error('Failed to save theme preference:', { error });
      }
    });
  };

  return (
    <AppContext.Provider value={{ theme, isDarkMode, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
