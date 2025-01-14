export type User = {
  id: string;
  email: string;
  displayName?: string;
  lastSignOutAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};
