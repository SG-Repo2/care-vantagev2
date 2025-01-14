# Authentication Hooks

This directory contains a collection of specialized React hooks that handle different aspects of authentication in the application. These hooks are composed together in the AuthContext to provide a complete authentication solution.

## Overview

The authentication system is split into the following specialized hooks:

### `useAuthState`

Manages the core authentication state and initialization.

```typescript
const {
  user,              // Current user object or null
  isLoading,         // Loading state
  error,             // Error state
  isAuthenticated,   // Boolean indicating auth status
  updateUser,        // Function to update user
  handleAuthError    // Centralized error handler
} = useAuthState();
```

### `useGoogleAuth`

Handles Google OAuth authentication flow.

```typescript
const {
  signInWithGoogle,  // Function to initiate Google sign-in
  isLoading,         // Loading state
  error             // Error state
} = useGoogleAuth();
```

### `useSessionManagement`

Manages session refresh and access token retrieval.

```typescript
const {
  refreshSession,    // Function to refresh the session
  getAccessToken,    // Function to get the current access token
  isRefreshing,      // Boolean indicating if session is refreshing
  isGettingToken     // Boolean indicating if retrieving token
} = useSessionManagement(userId, onSessionRefreshed);
```

### `useEmailAuth`

Handles email/password authentication.

```typescript
const {
  login,            // Function to login with email/password
  register,         // Function to register with email/password
  isLoading,        // Loading state
  error            // Error state
} = useEmailAuth(onAuthStateChange);
```

## Usage Examples

### Basic Authentication Flow

```typescript
import { useAuth } from '../contexts/AuthContext';

function LoginComponent() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Handle successful login
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your login UI
  );
}
```

### Google Sign-In

```typescript
import { useAuth } from '../contexts/AuthContext';

function GoogleSignInButton() {
  const { signInWithGoogle, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Handle successful sign-in
    } catch (error) {
      // Handle error
    }
  };

  return (
    <button 
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      Sign in with Google
    </button>
  );
}
```

### Session Management

```typescript
import { useAuth } from '../contexts/AuthContext';

function AuthenticatedComponent() {
  const { refreshSession, getAccessToken } = useAuth();

  const fetchProtectedData = async () => {
    try {
      const token = await getAccessToken();
      // Use token for API requests
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your component UI
  );
}
```

## Best Practices

1. **Error Handling**: Always wrap authentication operations in try-catch blocks and handle errors appropriately.

2. **Loading States**: Use the isLoading state to show loading indicators and prevent multiple simultaneous auth attempts.

3. **Token Management**: Use getAccessToken() for API requests rather than storing the token in state or localStorage.

4. **Session Refresh**: The session refresh mechanism is handled automatically, but you can manually trigger it if needed.

## Implementation Details

- All hooks use the authService for actual authentication operations
- Error handling is centralized through the handleAuthError utility
- Loading states are managed independently for different operations
- Session refresh logic includes automatic retry mechanisms
- Google authentication is configured through expo-auth-session

## Security Considerations

1. Tokens are never stored in localStorage
2. Session refresh happens automatically when tokens expire
3. Error messages are sanitized before displaying to users
4. Auth state is only accessible through the AuthContext
5. All sensitive operations are logged for security monitoring

## Contributing

When adding new authentication features:

1. Create a new specialized hook if the feature is complex enough
2. Add appropriate error handling and logging
3. Update this documentation with new examples
4. Add appropriate TypeScript types
5. Consider security implications