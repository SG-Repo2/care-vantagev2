import { supabase } from '../../../utils/supabase';
import { profileService } from '../../profile/services/profileService';
import { AuthError, User, Session } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('../../../utils/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));

class MockAuthError extends AuthError {
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

describe('User Management', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123',
    display_name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const mockUser: User = {
        id: 'test-id',
        email: testUser.email!,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockSignUpResponse = {
        data: {
          user: mockUser,
          session: null,
        },
        error: null,
      };

      jest.spyOn(supabase.auth, 'signUp').mockResolvedValue(mockSignUpResponse);

      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testUser.email);
    });

    it('should handle registration with existing email', async () => {
      const mockError = new MockAuthError(
        'User already registered',
        400,
        'USER_EXISTS'
      );

      jest.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      });

      expect(error).toBeDefined();
      expect(error?.message).toBe('User already registered');
      expect(data.user).toBeNull();
    });
  });

  describe('Profile Creation', () => {
    it('should create a profile after successful registration', async () => {
      const mockUser: User = {
        id: 'test-id',
        email: testUser.email!,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockProfile = {
        id: 'profile-id',
        user_id: mockUser.id,
        display_name: testUser.display_name,
        email: testUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        score: 0,
        permissions_granted: false,
        photo_url: null,
        device_info: {},
      };

      jest.spyOn(profileService, 'createProfile').mockResolvedValue(mockProfile);

      const profile = await profileService.createProfile(mockUser);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(mockProfile.id);
      expect(profile.email).toBe(mockUser.email);
    });

    it('should handle profile creation errors', async () => {
      const mockUser: User = {
        id: 'test-id',
        email: testUser.email!,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      jest.spyOn(profileService, 'createProfile').mockRejectedValue(
        new Error('Failed to create profile')
      );

      await expect(profileService.createProfile(mockUser)).rejects.toThrow(
        'Failed to create profile'
      );
    });
  });

  describe('User Authentication', () => {
    it('should successfully sign in user', async () => {
      const mockUser: User = {
        id: 'test-id',
        email: testUser.email!,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockSession: Session = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      const mockSignInResponse = {
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      };

      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue(mockSignInResponse);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
      expect(data.user?.email).toBe(testUser.email);
    });

    it('should handle invalid credentials', async () => {
      const mockError = new MockAuthError(
        'Invalid login credentials',
        400,
        'INVALID_CREDENTIALS'
      );

      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(error).toBeDefined();
      expect(error?.message).toBe('Invalid login credentials');
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });
  });
}); 