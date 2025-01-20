# CareVantage Health Metrics App - Debugging Guide

## Overview

This guide addresses common authentication and health data integration issues in the CareVantage health metrics app, focusing on the interaction between auth state, health providers, and metrics collection.

## 1. Common Issues

### 1.1 Authentication Flow Issues
- Auth state not properly initialized after app launch
- Profile creation race conditions during signup
- Health provider initialization failures
- Permission state inconsistencies between auth and health providers

### 1.2 Root Causes
- Asynchronous initialization timing issues
- Platform-specific health service availability
- Permission request lifecycle management
- Auth and health provider state synchronization

## 2. Debugging Steps

### 2.1 Auth State Verification
```typescript
// Check AuthContext initialization
const initializeAuth = async () => {
  try {
    const [result, error] = await ErrorHandler.handleAsync(
      supabase.auth.getSession(),
      'AuthProvider.initializeAuth'
    );
    
    if (error || !result?.data?.session) {
      console.error('Auth initialization failed:', error);
      return;
    }
    
    console.log('Auth state:', {
      hasSession: !!result.data.session,
      userId: result.data.session?.user?.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth error:', error);
  }
};
```

### 2.2 Health Provider Initialization
```typescript
// Debug health provider creation
const debugHealthProvider = async () => {
  try {
    console.log(`Creating provider for platform: ${Platform.OS}`);
    
    const provider = await HealthProviderFactory.createProvider();
    const permissions = await provider.checkPermissionsStatus?.();
    
    console.log('Health provider state:', {
      initialized: true,
      hasPermissions: permissions,
      platform: Platform.OS
    });
  } catch (error) {
    console.error('Provider initialization failed:', error);
  }
};
```

### 2.3 Metrics Collection Debug
```typescript
// Verify metrics collection
const debugMetricsCollection = async (provider: HealthProvider) => {
  try {
    const metrics = await provider.getMetrics();
    console.log('Collected metrics:', {
      date: metrics.date,
      steps: metrics.steps,
      distance: metrics.distance,
      calories: metrics.calories,
      heart_rate: metrics.heart_rate,
      daily_score: metrics.daily_score
    });
  } catch (error) {
    console.error('Metrics collection failed:', error);
  }
};
```

## 3. Platform-Specific Debugging

### 3.1 iOS (Apple HealthKit)
```typescript
// iOS permissions verification
const verifyIOSPermissions = () => {
  AppleHealthKit.isAvailable((error: Object, available: boolean) => {
    if (error || !available) {
      console.error('HealthKit not available:', error);
      return;
    }
    
    AppleHealthKit.initHealthKit(permissions, (initError: string) => {
      console.log('HealthKit initialization:', {
        success: !initError,
        error: initError
      });
    });
  });
};
```

### 3.2 Android (Health Connect)
```typescript
// Android permissions verification
const verifyAndroidPermissions = async () => {
  try {
    const available = await initialize();
    if (!available) {
      console.error('Health Connect not available');
      return;
    }
    
    await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' }
    ]);
    
    console.log('Health Connect permissions granted');
  } catch (error) {
    console.error('Health Connect setup failed:', error);
  }
};
```

## 4. Common Fixes

### 4.1 Auth State Reset
```typescript
const resetAuthState = async () => {
  // Clear provider instance
  await HealthProviderFactory.cleanup();
  
  // Reset auth state
  await supabase.auth.signOut();
  
  // Clear local storage if needed
  // ... (platform specific storage clear)
  
  // Reinitialize
  await initializeAuth();
};
```

### 4.2 Health Provider Reset
```typescript
const resetHealthProvider = async () => {
  // Cleanup existing instance
  await HealthProviderFactory.cleanup();
  
  // Create new instance
  const provider = await HealthProviderFactory.createProvider();
  
  // Request permissions again
  await provider.requestPermissions();
  
  // Verify metrics access
  await provider.getMetrics();
};
```

## 5. Troubleshooting Checklist

1. **Auth State**
   - [ ] Valid Supabase session exists
   - [ ] User ID is present and valid
   - [ ] Profile exists in database
   - [ ] Auth state matches backend

2. **Health Provider**
   - [ ] Provider initialized for platform
   - [ ] Required permissions granted
   - [ ] Provider instance active
   - [ ] No initialization errors

3. **Metrics Collection**
   - [ ] Provider returning valid metrics
   - [ ] All metric types collected
   - [ ] Metrics within valid ranges
   - [ ] Score calculation working

4. **Platform Integration**
   - iOS:
     - [ ] HealthKit available
     - [ ] Background delivery enabled
     - [ ] Permissions in Info.plist
   - Android:
     - [ ] Health Connect supported
     - [ ] API level ≥ 26
     - [ ] Permissions in manifest

## 6. Logging

Enable detailed logging by setting appropriate log levels:

```typescript
// src/utils/logger.ts
const LOG_LEVELS = {
  AUTH: true,
  HEALTH: true,
  METRICS: true,
  PROFILE: true
};

// Usage in components/services
if (LOG_LEVELS.HEALTH) {
  console.log('[HealthProvider] Debug info:', {
    // ... debug data
  });
}
```

## 7. Recovery Steps

1. **Auth Issues**
   - Sign out and clear session
   - Verify Supabase connection
   - Reinitialize auth flow
   - Check profile creation

2. **Health Provider Issues**
   - Cleanup provider instance
   - Verify platform support
   - Reinitialize provider
   - Request permissions

3. **Metrics Issues**
   - Verify provider state
   - Check permissions
   - Test individual metrics
   - Validate calculations

4. **Platform Issues**
   - iOS: Reset HealthKit authorization
   - Android: Clear Health Connect data
   - Verify app permissions
   - Check platform requirements

Remember to check the logs in your error monitoring service and the device's health app settings for additional context when issues occur. 