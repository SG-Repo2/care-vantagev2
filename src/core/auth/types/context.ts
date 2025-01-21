import { AuthState, AuthCapabilities } from './domain';

// Combines auth state and capabilities for the context
export type AuthContextType = AuthState & AuthCapabilities;

// Provider props type
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Error handling types for context
export interface AuthContextError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}