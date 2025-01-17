export const AuthConfig = {
  session: {
    persistenceMode: 'local' as const, // 'local' | 'memory'
    timeout: 30 * 60 * 1000, // 30 minutes
    refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    validationInterval: 5 * 60 * 1000, // 5 minutes
  },
  security: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
    },
    mfa: {
      enabled: true,
      preferredMethod: 'totp' as const,
      backupCodesCount: 10,
      maxAttempts: 3,
      lockoutDuration: 5 * 60 * 1000, // 5 minutes
    },
  },
  email: {
    verificationRequired: true,
    verificationTimeout: 24 * 60 * 1000, // 24 hours
    passwordResetTimeout: 60 * 60 * 1000, // 1 hour
  },
  rateLimiting: {
    enabled: true,
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    signup: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    passwordReset: {
      maxAttempts: 2,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    verification: {
      maxAttempts: 3,
      windowMs: 30 * 60 * 1000, // 30 minutes
    },
    mfa: {
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000, // 5 minutes
    },
  },
  routes: {
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      verifyEmail: '/auth/verify-email',
      resetPassword: '/auth/reset-password',
      mfaSetup: '/auth/mfa-setup',
    },
    app: {
      home: '/app/home',
      profile: '/app/profile',
      settings: '/app/settings',
    },
  },
  supabase: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
} as const;

// Type for the entire config
export type AuthConfigType = typeof AuthConfig;

// Helper type for accessing nested paths
export type AuthConfigPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${AuthConfigPath<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

// Helper function to get a value from a path
export function getConfigValue<T>(path: AuthConfigPath<AuthConfigType>): T {
  return path.split('.').reduce((obj, key) => obj[key], AuthConfig as any);
}

// Validate password against security requirements
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = AuthConfig.security.password;

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export commonly used timeouts in seconds
export const Timeouts = {
  SESSION: AuthConfig.session.timeout / 1000,
  REFRESH: AuthConfig.session.refreshThreshold / 1000,
  VALIDATION: AuthConfig.session.validationInterval / 1000,
  PASSWORD_RESET: AuthConfig.email.passwordResetTimeout / 1000,
  VERIFICATION: AuthConfig.email.verificationTimeout / 1000,
} as const;
