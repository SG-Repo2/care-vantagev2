# Health Records Implementation Guide – CareVantage Mobile App (Revised)

This document outlines the Health Connect integration process for the CareVantage mobile app's health records module.  This revised guide emphasizes modularity, robust error handling, and comprehensive testing.

## 1. Project Structure

The project uses a provider-based architecture within the `src/health-metrics` directory. This structure promotes platform-specific data retrieval while maintaining a consistent interface.

```
src/health-metrics/
├── App.tsx
├── components/
├── contexts/
├── hooks/  // Added for reusable logic
└── providers/
    ├── apple/
    └── google/
```

## 2. Dependencies

Ensure the following packages are installed (check `package.json`):

```json
{
  "dependencies": {
    "react-native-health-connect": "^3.3.2", // Updated to latest version
    "expo-health-connect": "~0.5.0",
    "expo-build-properties": "^0.13.2",
    // ... other dependencies
  }
}
```

Verify React Native and Expo versions (RN ≥ 0.71, Expo with EAS Build recommended).

## 3. Expo Configuration (`app.config.js`)

Configure Android for Health Connect:

```javascript
module.exports = {
  expo: {
    // ... other configurations
    plugins: [
      // ... other plugins
      [
        "react-native-health-connect",
        {
          package: "com.groebe1kenobi.carevantage",
          permissions: [
            "android.permission.health.READ_STEPS",
            "android.permission.health.READ_DISTANCE",
            "android.permission.health.READ_HEART_RATE",
            "android.permission.health.READ_ACTIVE_CALORIES_BURNED"
          ],
          minSdkVersion: 26,
          targetSdkVersion: 34
        }
      ]
    ]
    // ... other configurations
  }
};
```

## 4. Android Manifest (`android/app/src/main/AndroidManifest.xml`)

Include Health Connect permissions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.health.READ_STEPS"/>
    <uses-permission android:name="android.permission.health.READ_DISTANCE"/>
    <uses-permission android:name="android.permission.health.READ_HEART_RATE"/>
    <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED"/>

    <queries>
        <package android:name="com.google.android.apps.healthdata" />
    </queries>

    <application>
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## 5. Health Provider Implementation (`src/health-metrics/providers/google/GoogleHealthProvider.ts`)

Implement robust error handling and asynchronous operations:

```typescript
import { initialize, readRecords } from 'react-native-health-connect';
import { Platform } from 'react-native';
import { HealthProvider, HealthMetrics } from '../types';

export class GoogleHealthProvider implements HealthProvider {
    private initialized = false;

    async isAvailable(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            console.log('Initializing Health Connect...');
            const available = await initialize();
            this.initialized = available;
            return available;
        } catch (error) {
            console.error('Health Connect initialization error:', error);
            return false;
        }
    }

    async getMetrics(date: Date): Promise<HealthMetrics> {
        if (!this.initialized) {
            throw new Error('Health Connect not initialized');
        }
        const timeRangeFilter = {
            operator: 'between',
            startTime: new Date(date.setHours(0,0,0,0)).toISOString(),
            endTime: new Date(date.setHours(23,59,59,999)).toISOString()
        };

        try {
            const [steps, distance, calories] = await Promise.all([
                this.getSteps(timeRangeFilter),
                this.getDistance(timeRangeFilter),
                this.getCalories(timeRangeFilter)
            ]);

            return {
                steps,
                distance,
                calories,
                heartRate: undefined // Health Connect doesn't support real-time heart rate
            };
        } catch (error) {
            console.error('Error fetching health metrics:', error);
            throw new Error('Failed to fetch health metrics'); // More informative error
        }
    }

    // Implement getSteps, getDistance, getCalories, etc. with error handling
}
```

## 6. Context Implementation (`src/health-metrics/contexts/HealthDataContext.tsx`)

Use a reducer for state management and `useCallback` for optimized refresh logic:

```typescript
// ... (Import statements)

export function HealthDataProvider({ children, config }) {
    const [state, dispatch] = useReducer(healthDataReducer, initialState);

    const refresh = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const provider = await HealthProviderFactory.createProvider();
            const permissionsGranted = await provider.requestPermissions();
            if (!permissionsGranted) {
                throw new Error('Health permissions not granted');
            }
            const metrics = await provider.getMetrics(new Date());
            dispatch({ type: 'SET_METRICS', payload: metrics });
            dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: {
                type: 'data',
                message: error instanceof Error ? error.message : 'Failed to fetch health data',
                details: error
            }});
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    useEffect(() => {
        refresh();
        if (config?.enableBackgroundSync) {
            const interval = setInterval(refresh, config.syncInterval || 300000);
            return () => clearInterval(interval);
        }
    }, [refresh, config?.enableBackgroundSync, config?.syncInterval]);

    return (
        <HealthDataContext.Provider value={{ ...state, refresh }}>
            {children}
        </HealthDataContext.Provider>
    );
}

// ... (Reducer and initialState)
```

## 7. Testing

*   **Emulator Setup:** Use API Level 34 for built-in Health Connect. For API ≤ 33, install Health Connect from the Play Store. Enable screen lock in the emulator.
*   **Verification:**
    1.  `npm run android`
    2.  `adb logcat | grep -i "health"` (check initialization)
    3.  Confirm permission prompts
    4.  Check metrics in the UI
    5.  Test background sync (if enabled)

## 8.  Error Handling and Logging

Implement comprehensive error handling throughout the data fetching process. Log errors using a suitable logging mechanism (e.g., console logging for development, a dedicated logging service for production).

## 9. Production Considerations

*   Submit the Health Connect declaration form to Google Play.
*   Implement retry logic with exponential backoff for network errors.
*   Consider a caching strategy for offline access.
*   Provide a fallback UI for unsupported devices.