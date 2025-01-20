# CareVantage Health Metrics App - Debugging Guide

## Overview

This guide addresses common authentication and profile creation issues in the CareVantage health metrics app, focusing on the interaction between Supabase auth, health data permissions, and user profile management.

## 1. Common Issues

### 1.1 Authentication Flow Issues
- "Auth record not found after maximum attempts"
- "PGRST116 (0 rows returned)" when querying user profiles
- Health permissions not being properly granted after signup
- Profile creation failing during initial signup

### 1.2 Root Causes
- Race conditions between auth.users creation and profile initialization
- Mismatched Supabase environment configurations
- Health provider initialization timing issues
- RLS policies blocking profile creation

## 2. Debugging Steps

### Step 1: Verify Supabase Configuration
```typescript
// src/utils/supabase.ts
const supabaseUrl = 'https://jnxsqqsbhzirijklxqbq.supabase.co';
const supabaseAnonKey = 'your-key';

// Ensure these match your Supabase project settings in:
// 1. .env file
// 2. eas.json for builds
// 3. app.config.js
```

### Step 2: Check Auth Flow
```typescript
// src/health-metrics/contexts/AuthContext.tsx
const initializeAuth = async () => {
  try {
    const { data: { session }, error: sessionError } = 
      await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    // Log session state
    console.log('Session state:', {
      hasSession: !!session,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });
    
    // Rest of initialization...
  } catch (error) {
    console.error('Auth initialization error:', error);
    throw error;
  }
};
```

### Step 3: Profile Creation Debug Points
```typescript
// src/features/profile/services/profileService.ts
async createProfile(user: User): Promise<UserProfile> {
  try {
    console.log('Creating profile for user:', user.id);
    
    // First verify session
    const { data: { session }, error: sessionError } = 
      await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No valid session for profile creation');
      throw new Error('No valid session found');
    }

    // Check for existing profile first
    const { data: existingProfile, error: selectError } = 
      await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    console.log('Existing profile check:', {
      exists: !!existingProfile,
      error: selectError
    });

    // Rest of profile creation...
  } catch (err) {
    console.error('Profile creation error:', err);
    throw err;
  }
}
```

### Step 4: Health Provider Initialization
```typescript
// src/health-metrics/providers/HealthProviderFactory.ts
static async createProvider(): Promise<HealthProvider> {
  try {
    console.log('Creating health provider...');
    
    if (this.instance) {
      console.log('Returning existing provider');
      return this.instance;
    }

    const provider = Platform.select({
      ios: () => new AppleHealthProvider(),
      android: () => new GoogleHealthProvider(),
      default: () => {
        throw new Error('Unsupported platform');
      }
    })();

    // Log initialization steps
    console.log('Initializing provider...');
    await provider.initialize();
    
    console.log('Requesting permissions...');
    await provider.requestPermissions();
    
    this.instance = provider;
    return provider;
  } catch (error) {
    console.error('Provider creation failed:', error);
    throw error;
  }
}
```

## 3. Common Fixes

### 3.1 Profile Creation Race Condition
```typescript
// src/features/profile/services/profileService.ts
async createProfile(user: User): Promise<UserProfile> {
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 1000;

  while (retryCount < maxRetries) {
    try {
      // Attempt profile creation
      const result = await this.attemptProfileCreation(user);
      return result;
    } catch (err) {
      console.log(`Retry ${retryCount + 1} failed:`, err);
      retryCount++;
      
      if (retryCount === maxRetries) throw err;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, baseDelay * Math.pow(2, retryCount))
      );
    }
  }
  
  throw new Error('Profile creation failed after retries');
}
```

### 3.2 Health Provider Initialization
```typescript
// src/health-metrics/contexts/AuthContext.tsx
const initializeUserServices = async (currentUser: User) => {
  try {
    // 1. Get/Create Profile
    let profile = await profileService.getProfile(currentUser.id);
    if (!profile) {
      profile = await profileService.createProfile(currentUser);
    }

    // 2. Initialize Health Provider
    const provider = await HealthProviderFactory.createProvider();
    
    // 3. Update Profile with Permissions
    if (provider) {
      await profileService.updateProfile(currentUser.id, {
        permissions_granted: true
      });
    }
  } catch (err) {
    // Log failure and update profile
    await profileService.updateProfile(currentUser.id, {
      permissions_granted: false,
      last_error: err instanceof Error ? err.message : 'Unknown error'
    });
    throw err;
  }
};
```

## 4. Data Validation

### 4.1 Profile Validation
```sql
-- Check this exists in your Supabase SQL editor
CREATE OR REPLACE FUNCTION public.check_user_profile_valid(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users u
    JOIN auth.users au ON au.id = u.id
    WHERE u.id = user_id 
    AND u.deleted_at IS NULL
    AND u.permissions_granted = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Permissions Check
```typescript
// src/health-metrics/hooks/useHealthData.ts
const validateHealthAccess = async () => {
  if (!user?.id) return false;
  
  const { data, error } = await supabase
    .rpc('check_user_profile_valid', {
      user_id: user.id
    });
    
  if (error) {
    console.error('Health access validation failed:', error);
    return false;
  }
  
  return !!data;
};
```

## 5. Troubleshooting Checklist

1. **Auth Flow**
   - [ ] Verify Supabase project URL and key
   - [ ] Check auth.users table for user record
   - [ ] Validate session token exists
   - [ ] Confirm RLS policies are correct

2. **Profile Creation**
   - [ ] Check profile exists in public.users
   - [ ] Verify foreign key constraint to auth.users
   - [ ] Validate permissions_granted flag
   - [ ] Check for deleted_at null

3. **Health Provider**
   - [ ] Confirm platform-specific provider initialized
   - [ ] Verify permissions granted
   - [ ] Check provider instance exists
   - [ ] Validate metrics syncing

4. **Data Flow**
   - [ ] Verify metrics table structure
   - [ ] Check RLS policies on health_metrics
   - [ ] Validate foreign keys
   - [ ] Confirm indexes exist

## 6. Testing

```typescript
// src/features/profile/tests/profile.test.ts
describe('Profile Creation Flow', () => {
  it('should create profile after auth', async () => {
    // 1. Sign up user
    const { user } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(user).toBeDefined();
    
    // 2. Wait for profile
    const profile = await profileService.getProfile(user!.id);
    expect(profile).toBeDefined();
    
    // 3. Check permissions
    expect(profile!.permissions_granted).toBe(false);
    
    // 4. Initialize health
    await HealthProviderFactory.createProvider();
    
    // 5. Verify updated profile
    const updatedProfile = await profileService.getProfile(user!.id);
    expect(updatedProfile!.permissions_granted).toBe(true);
  });
});
```

## 7. Monitoring

### 7.1 Key Metrics to Monitor
- Auth success rate
- Profile creation success rate
- Health provider initialization success
- Metrics sync success rate
- API latency

### 7.2 Implementation
```typescript
// src/utils/monitor.ts
monitor.trackMetric('auth_flow', {
  event: 'profile_creation',
  success: true,
  duration_ms: endTime - startTime,
  retry_count: retryCount
});
```

## 8. Recovery Actions

1. **Auth Issues**
   - Clear local storage
   - Sign out and back in
   - Reinitialize health provider

2. **Profile Issues**
   - Validate profile exists
   - Check permissions state
   - Reinitialize if necessary

3. **Health Provider Issues**
   - Clear provider instance
   - Recheck permissions
   - Reinitialize provider

4. **Data Sync Issues**
   - Validate local queue
   - Force sync attempt
   - Clear cached data

Remember to check the logs in your Supabase dashboard and your app's error monitoring service for additional context when issues occur.