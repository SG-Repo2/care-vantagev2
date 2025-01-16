export default {
  expo: {
    name: "care-vantage",
    slug: "care-vantage",
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
        UIBackgroundModes: ["fetch", "remote-notification"],
      },
      config: {
        usesNonExemptEncryption: false
      },
      entitlements: {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.healthkit.access": [
          "health-records",
          "HKQuantityTypeIdentifierStepCount",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          "HKQuantityTypeIdentifierDistanceWalkingRunning"
        ],
        "com.apple.developer.healthkit.background-delivery": true
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
        "android.permission.health.READ_ACTIVE_CALORIES_BURNED"
      ]
    },
    plugins: [
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
}
