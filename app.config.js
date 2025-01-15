module.exports = {
  expo: {
    owner: "groebe1kenobi",
    name: 'care-vantage',
    slug: 'care-vantage',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    scheme: 'carevantage', // Updated to a valid URI scheme
    ios: {
      bundleIdentifier: 'com.groebe1kenobi.carevantage',
      supportsTablet: true,
      
      infoPlist: {
        NSHealthShareUsageDescription: 'CareVantage needs access to read your health data to track your fitness and wellness metrics.',
        NSHealthUpdateUsageDescription: 'CareVantage requires permission to write health data to help you track and manage your fitness goals.',
        NSHealthClinicalUsageDescription: 'Allow CareVantage to check health clinical info',
        UIBackgroundModes: ['fetch', 'remote-notification'],
        UIRequiresFullScreen: true,
        UIStatusBarStyle: 'auto'
      },
      entitlements: {
        'com.apple.developer.healthkit': true,
        'com.apple.developer.healthkit.access': [
          'health-records',
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierDistanceWalkingRunning'
        ],
        'com.apple.developer.healthkit.background-delivery': true
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.groebe1kenobi.carevantage',
      scheme: 'carevantage', // Updated to a valid URI scheme

      permissions: [
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_DISTANCE',
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.READ_ACTIVE_CALORIES_BURNED'
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.1',
            useFrameworks: 'static',
            newArchEnabled: false,
            fabricEnabled: false
          },
          android: {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "minSdkVersion": 26
          }
        }, 

      ],
      [
        'react-native-health',
        {
          isClinicalDataEnabled: true,
          healthSharePermission: 'CareVantage needs access to read your health data to track your fitness and wellness metrics.',
          healthUpdatePermission: 'CareVantage requires permission to write health data to help you track and manage your fitness goals.',
          healthClinicalDescription: 'Allow CareVantage to check health clinical info'
        }
      ],
      [
        "react-native-health-connect",
        {
          "package": "com.groebe1kenobi.carevantage",
          "permissions": [
            "android.permission.health.READ_STEPS",
            "android.permission.health.READ_DISTANCE",
            "android.permission.health.READ_HEART_RATE",
            "android.permission.health.READ_ACTIVE_CALORIES_BURNED"
          ]
        }
      ]
    ],
    extra: {
      supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      googleAuth: {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
      },
      eas: {
        projectId: "ed8a0109-5476-4b93-9502-e9f46028b8d1"
      }
    },
    experiments: {
      newArchEnabled: false
    },
    developmentClient: {
      silentLaunch: true
    }
  }
};
