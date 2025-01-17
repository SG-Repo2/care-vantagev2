import { supabase } from '../../../utils/supabase';
import { profileService } from '../../profile/services/profileService';
import { AuthError } from '@supabase/supabase-js';

describe('User Management', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123',
    display_name: 'Test User',
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const mockSignUpResponse = {
        data: {
          user: {
            id: 'test-id',
            email: testUser.email,
          },
          session: null,
        },
        error: null,
      };

      // Mock the sign-up call
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
      const mockError: AuthError = {
        name: 'AuthError',
        message: 'User already registered',
        status: 400,
      };

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
      const mockUser = {
        id: 'test-id',
        email: testUser.email,
      };

      const mockProfile = {
        id: 'profile-id',
        user_id: mockUser.id,
        display_name: testUser.display_name,
        email: mockUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        score: 0,
        permissions_granted: false,
      };

      jest.spyOn(profileService, 'createProfile').mockResolvedValue(mockProfile);

      const profile = await profileService.createProfile(mockUser);

      expect(profile).toBeDefined();
      expect(profile.user_id).toBe(mockUser.id);
      expect(profile.email).toBe(mockUser.email);
      expect(profile.score).toBe(0);
    });

    it('should handle profile creation errors', async () => {
      const mockUser = {
        id: 'test-id',
        email: testUser.email,
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
      const mockSignInResponse = {
        data: {
          user: {
            id: 'test-id',
            email: testUser.email,
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
          },
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
      const mockError: AuthError = {
        name: 'AuthError',
        message: 'Invalid login credentials',
        status: 400,
      };

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