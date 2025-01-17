// Context and Hooks
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { useAuthentication } from './hooks/useAuthentication';

// Services
export { authService } from './services/AuthService';
export { passwordService } from './services/PasswordService';
export { emailVerificationService } from './services/EmailVerificationService';
export { mfaService } from './services/MFAService';
export { rateLimitService } from './services/RateLimitService';

// Types
export type {
  User,
  AuthState,
  AuthCredentials
} from './types/auth.types';

// Configuration
export {
  AuthConfig,
  Timeouts,
  validatePassword,
  getConfigValue
} from './config/AuthConfig';
export type { AuthConfigType, AuthConfigPath } from './config/AuthConfig';

// Error types
export {
  AuthError,
  SessionExpiredError,
  TokenRefreshError,
  InvalidCredentialsError,
  UserNotFoundError,
  EmailAlreadyInUseError,
  WeakPasswordError,
  NetworkError,
  UnauthorizedError,
  TooManyRequestsError
} from './errors/AuthErrors';

// Utility functions
export { mapSupabaseUser } from './types/auth.types';
