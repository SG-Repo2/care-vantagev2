module.exports = {
  expo: {
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
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.groebe1kenobi.carevantage',
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
          'HKQuantityTypeIdentifierBodyMass',
          'HKQuantityTypeIdentifierHeight',
          'HKQuantityTypeIdentifierBodyMassIndex'
        ],
        'com.apple.developer.healthkit.background-delivery': true
      },
      scheme: 'carevantage',
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.groebe1kenobi.carevantage'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    scheme: 'carevantage',
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.1',
            useFrameworks: 'static',
            newArchEnabled: false,
            fabricEnabled: false
          }
        }
      ],
      [
        'react-native-health',
        {
          isClinicalDataEnabled: true,
          healthSharePermission: 'CareVantage needs access to read your health data to track your fitness and wellness metrics.',
          healthUpdatePermission: 'CareVantage requires permission to write health data to help you track and manage your fitness goals.',
          healthClinicalDescription: 'Allow CareVantage to check health clinical info'
        }
      ]
    ],
    extra: {
      googleAuth: {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
      }
    },
    experiments: {
      newArchEnabled: true
    },
    developmentClient: {
      silentLaunch: true
    }
  }
};
