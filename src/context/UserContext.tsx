import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../features/auth/types/auth';
import { StorageService } from '../core/storage/StorageService';
import { profileService } from '../features/profile/services/profileService';

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
        // Get latest profile data from Supabase
        const profile = await profileService.getProfile(userData.id);
        if (profile) {
          // Merge profile data with stored user data
          setUser({
            ...userData,
            displayName: profile.display_name,
            photoURL: profile.photo_url
          });
        } else {
          setUser(userData);
        }
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
    try {
      if (newUser) {
        // Update profile in Supabase
        await profileService.updateProfile(newUser.id, {
          display_name: newUser.displayName,
          photo_url: newUser.photoURL
        });
        await StorageService.setUserData(newUser);
      } else {
        await StorageService.clearAll();
      }
      setUser(newUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
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
