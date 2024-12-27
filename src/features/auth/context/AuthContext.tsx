import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import GoogleAuthService from '../services/GoogleAuthService';
import UserService from '../services/UserService';
import { initializeFirebase, getFirebaseApp } from '../../../config/firebase';

type User = {
  id: string;
  email: string;
  displayName?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribe: () => void;

    const initAuth = async () => {
      try {
        const app = await getFirebaseApp();
        unsubscribe = auth(app).onAuthStateChanged(async (firebaseUser: FirebaseAuthTypes.User | null) => {
          try {
            if (firebaseUser) {
              const user = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
              };
              
              // Get or create user document in Firestore
              const firestoreUser = await UserService.getUser(user.id);
              if (!firestoreUser) {
                await UserService.createUser(user);
              } else {
                // Update user data if needed
                const needsUpdate = 
                  firestoreUser.email !== user.email || 
                  firestoreUser.displayName !== user.displayName;
                
                if (needsUpdate) {
                  await UserService.updateUser(user.id, {
                    email: user.email,
                    displayName: user.displayName,
                  });
                }
              }
              
              await AsyncStorage.setItem('user', JSON.stringify(user));
              setState(prev => ({
                ...prev,
                isAuthenticated: true,
                user,
                isLoading: false,
              }));
            } else {
              await AsyncStorage.removeItem('user');
              setState(prev => ({
                ...prev,
                isAuthenticated: false,
                user: null,
                isLoading: false,
              }));
            }
          } catch (error) {
            console.error('Error in auth state change:', error);
            setState(prev => ({
              ...prev,
              error: error instanceof Error ? error.message : 'Authentication error',
              isLoading: false,
            }));
          }
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Authentication error',
          isLoading: false,
        }));
      }
    };

    initAuth();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const app = await getFirebaseApp();
      const userCredential = await auth(app).signInWithEmailAndPassword(email, password);
      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await UserService.getUser(user.id) || await UserService.createUser(user);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const app = await getFirebaseApp();
      const userCredential = await auth(app).createUserWithEmailAndPassword(email, password);
      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await UserService.createUser(user);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await GoogleAuthService.signIn();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await UserService.getUser(user.id) || await UserService.createUser(user);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Google Sign-In failed',
        isLoading: false,
      }));
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const app = await getFirebaseApp();
      const currentUser = auth(app).currentUser;
      if (currentUser) {
        await UserService.updateUser(currentUser.uid, {
          lastSignOutAt: new Date().toISOString(),
        });
      }
      await GoogleAuthService.signOut();
      await AsyncStorage.removeItem('user');
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Logout failed',
        isLoading: false,
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
