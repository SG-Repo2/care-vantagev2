import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../services/authService';
import { StorageService } from '../services/storageService';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await StorageService.getUserData();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateUser = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await StorageService.setUserData(newUser);
    } else {
      await StorageService.clearAll();
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: updateUser,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
