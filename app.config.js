import 'dotenv/config';

// Debug logging for environment variables
console.log('Environment Variables Check:', {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  googleIos: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'Set' : 'Missing',
  googleAndroid: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'Set' : 'Missing',
  googleWeb: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Set' : 'Missing',
  googleExpo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ? 'Set' : 'Missing',
});

export default ({ config }) => ({
  ...config,
  expo: {
    name: "care-vantage",
    slug: "care-vantage",
    scheme: "care-vantage",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    extra: {
      eas: {
        projectId: "ed8a0109-5476-4b93-9502-e9f46028b8d1"
      },
      supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      },
      googleAuth: {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
      }
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.groebe1kenobi.carevantage",
      infoPlist: {
        NSHealthShareUsageDescription: "This app requires access to health data to track your fitness metrics.",
        NSHealthUpdateUsageDescription: "This app requires access to health data to track your fitness metrics.",
        NSCameraUsageDescription: "This app uses the camera to let you take profile photos.",
        NSPhotoLibraryUsageDescription: "This app accesses your photos to let you share them as profile photos.",
        UIBackgroundModes: ["fetch", "remote-notification"],
      },
      config: {
        usesNonExemptEncryption: false
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
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      package: "com.groebe1kenobi.carevantage",
      permissions: [
        "android.permission.health.READ_STEPS",
        "android.permission.health.READ_DISTANCE",
        "android.permission.health.READ_HEART_RATE",
        "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    plugins: [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them as profile photos.",
          "cameraPermission": "The app uses the camera to let you take profile photos."
        }
      ],
      [
        "expo-health-connect",
        {
          package: "com.groebe1kenobi.carevantage",
          permissions: [
            "Steps",
            "Distance",
            "HeartRate",
            "ActiveCaloriesBurned"
          ]
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 26,
            buildToolsVersion: "34.0.0"
          },
          ios: {
            deploymentTarget: "16.1",
            useFrameworks: "static",
            newArchEnabled: false
          }
        }
      ]
    ]
  }
});
