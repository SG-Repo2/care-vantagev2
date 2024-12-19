import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';
import { UserState } from '../types';
import { UserAction, userReducer, initialUserState } from '../state';

interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const transformUserData = (data: DocumentData): UserState['profile'] => ({
  id: data.id || '',
  email: data.email || '',
  displayName: data.displayName || null,
  photoURL: data.photoURL || null,
  preferences: {
    measurementUnit: data.preferences?.measurementUnit || 'metric',
    language: data.preferences?.language || 'en',
    timezone: data.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    healthGoals: data.preferences?.healthGoals || {}
  },
  healthMetrics: {
    goals: data.healthMetrics?.goals || {},
    lastUpdate: data.healthMetrics?.lastUpdate ? new Date(data.healthMetrics.lastUpdate) : null,
    syncStatus: data.healthMetrics?.syncStatus || 'idle'
  },
  lastSync: data.lastSync ? new Date(data.lastSync) : null
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialUserState);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return transformUserData({ id: userDoc.id, ...userData });
      } else {
        const newUserProfile = {
          id: userId,
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || null,
          preferences: initialUserState.profile.preferences,
          healthMetrics: initialUserState.profile.healthMetrics,
          lastSync: new Date().toISOString()
        };
        
        await setDoc(userDocRef, newUserProfile);
        return transformUserData(newUserProfile);
      }
    } catch (error) {
      console.error('[UserContext] Error fetching/creating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userProfile = await fetchUserProfile(user.uid);
          dispatch({ 
            type: 'SET_USER', 
            payload: { 
              profile: userProfile,
              session: {
                isAuthenticated: true,
                lastActive: new Date(),
                authToken: await user.getIdToken(),
                error: null
              }
            } 
          });
        } catch (error) {
          console.error('[UserContext] Auth state change error:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load user profile' });
        }
      } else {
        dispatch({ type: 'CLEAR_USER' });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};