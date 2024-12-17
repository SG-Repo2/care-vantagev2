module.exports = {
  expo: {
    name: 'care-vantage',
    slug: 'care-vantage',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
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
        NSHealthClinicalHealthRecordsShareUsageDescription: 'Allow CareVantage to check health clinical info'
      },
      entitlements: {
        'com.apple.developer.healthkit': true,
        'com.apple.developer.healthkit.access': [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierBodyMass',
          'HKQuantityTypeIdentifierHeight',
          'HKQuantityTypeIdentifierBodyMassIndex'
        ]
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
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.0'
          }
        }
      ]
    ],
    experiments: {
      newArchEnabled: true
    },
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    }
  }
};
