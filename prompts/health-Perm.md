# HealthKit/Health Connect Integration Guide

## Overview

This document provides a sequential validation and debugging process for resolving permission and integration issues with HealthKit (iOS) and Health Connect (Android) in the CareVantage app.

## 1. Validate Configuration Files

### 1.1 iOS Configuration
```typescript
// Verify app.config.js iOS configuration
{
  ios: {
    infoPlist: {
      NSHealthShareUsageDescription: "This app requires access to health data to track your fitness metrics.",
      NSHealthUpdateUsageDescription: "This app requires access to health data to track your fitness metrics.",
      UIBackgroundModes: ["fetch", "remote-notification"],
    },
    entitlements: {
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.background-delivery": true,
      "com.apple.developer.healthkit.access": {
        "health-records": true,
        "HKQuantityTypeIdentifierStepCount": true,
        "HKQuantityTypeIdentifierHeartRate": true,
        "HKQuantityTypeIdentifierActiveEnergyBurned": true,
        "HKQuantityTypeIdentifierDistanceWalkingRunning": true
      }
    }
  }
}
```

### 1.2 Android Configuration
```typescript
// Verify app.config.js Android configuration
{
  android: {
    permissions: [
      "android.permission.health.READ_STEPS",
      "android.permission.health.READ_DISTANCE",
      "android.permission.health.READ_HEART_RATE",
      "android.permission.health.READ_ACTIVE_CALORIES_BURNED"
    ],
  }
}
```

## 2. Validate Database Schema and Policies

### 2.1 Required Schema Objects
```sql
-- Verify users table structure
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  display_name text,
  permissions_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Verify health_metrics table structure
CREATE TABLE public.health_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id),
  date date NOT NULL,
  steps integer,
  distance numeric,
  calories numeric,
  heart_rate numeric,
  daily_score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2.2 Required RLS Policies
```sql
-- Verify all required RLS policies are present
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Add missing INSERT policy
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Health metrics policies
CREATE POLICY "Users can view own metrics"
  ON public.health_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON public.health_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON public.health_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## 3. Sequential Validation Steps

### 3.1 Authentication Flow
1. Verify user signup/signin completes successfully
2. Confirm Supabase auth token is stored securely
3. Validate user ID is accessible via `supabase.auth.getUser()`

### 3.2 Profile Creation
1. Verify profile creation immediately after authentication:
```typescript
// In AuthContext.tsx or similar
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        // Create or get user profile
        const profile = await profileService.createProfile(session.user);
        console.log('Profile created/retrieved:', profile);
        
        // Only proceed to health initialization after profile exists
        if (profile) {
          await initializeHealthProvider();
        }
      } catch (err) {
        console.error('Failed to initialize user profile:', err);
        throw err;
      }
    }
  }
);
```

### 3.3 Health Provider Initialization
1. Verify provider initialization occurs after profile creation
2. Confirm permissions are requested properly:
```typescript
// In HealthProviderFactory.ts
async createProvider(): Promise<HealthProvider> {
  try {
    console.log('[HealthProviderFactory] Creating provider...');
    
    const provider = Platform.select({
      ios: () => new AppleHealthProvider(),
      android: () => new GoogleHealthProvider(),
      default: () => {
        throw new Error('Platform not supported');
      },
    })();

    console.log('[HealthProviderFactory] Initializing provider...');
    await provider.initialize();

    console.log('[HealthProviderFactory] Requesting permissions...');
    await provider.requestPermissions();

    return provider;
  } catch (error) {
    console.error('[HealthProviderFactory] Error:', error);
    throw error;
  }
}
```

## 4. Error Validation Checklist

### 4.1 Common Error Types
- [ ] RLS Policy Violations
  - Verify user ID matches exactly between auth and database
  - Confirm all necessary policies exist and are enabled
- [ ] Permission Errors
  - Check Info.plist entries (iOS)
  - Verify manifest permissions (Android)
  - Confirm permissions requested at correct time
- [ ] Profile Creation Errors
  - Validate profile data structure
  - Ensure profile creation happens before health initialization

### 4.2 Debugging Process
1. Enable detailed logging
2. Check console for initialization sequence
3. Verify database operations in Supabase dashboard
4. Test permissions flow on both platforms




## 6. Resolution Validation

1. Verify successful user creation in Supabase
2. Confirm profile creation with correct ID
3. Validate health permissions granted
4. Test successful health data sync
5. Verify data appears in Supabase tables
