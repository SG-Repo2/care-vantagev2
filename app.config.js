export default {
  expo: {
    name: "care-vantage",
    slug: "care-vantage",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.groebe1kenobi.carevantage",
      infoPlist: {
        NSHealthShareUsageDescription: "This app requires access to health data to track your fitness metrics.",
        NSHealthUpdateUsageDescription: "This app requires access to health data to track your fitness metrics."
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
      ]
    ]
  }
}
