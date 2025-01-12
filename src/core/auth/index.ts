// Main hooks
export { useAuthentication } from './hooks/useAuthentication';
export { useAuth } from './contexts/AuthContext';

// Context Provider
export { AuthProvider } from './contexts/AuthContext';

// Service (for direct access if needed)
export { authService } from './services/AuthService';

// Types
export type {
  User,
  AuthState,
  AuthCredentials
} from './types/auth.types';

// Utility functions
export { mapSupabaseUser } from './types/auth.types';

// Error types
export {
  SessionExpiredError,
  TokenRefreshError
} from './errors/AuthErrors';