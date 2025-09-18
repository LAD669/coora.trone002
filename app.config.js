import 'dotenv/config';

export default {
  expo: {
    name: "Coora for Sport",
    slug: "coora-for-sport",
    version: "1.1.7",
    orientation: "portrait",
    icon: "./images/coora.icon.png",
    scheme: "coora",
    userInterfaceStyle: "automatic",
    linking: {
      prefixes: ["coora://"],
      config: {
        screens: {
          "(app)": {
            screens: {
              "(tabs)": {
                screens: {
                  dashboard: "dashboard",
                  infohub: "infohub",
                  calendar: "calendar",
                  playerboard: "playerboard",
                },
              },
            },
          },
          "(manager)": {
            screens: {
              "(tabs)": {
                screens: {
                  dashboard: "manager/dashboard",
                  infohub: "manager/infohub",
                  calendar: "manager/calendar",
                  playerboard: "manager/playerboard",
                },
              },
            },
          },
        },
      },
    },
    owner: "cooraforsport",
    platforms: [
      "ios",
      "android"
    ],

    experimental: {
      newArchEnabled: false
    },
    splash: {
      image: "./images/splashscreen.yucbyab.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.coora.app.cooraforsport",
      buildNumber: "6",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "This app uses the camera to take photos for team posts and profile pictures.",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to save and share team photos.",
        NSLocationWhenInUseUsageDescription: "This app may use location services to show nearby events and team activities.",
        NSUserTrackingUsageDescription: "This app uses tracking to provide personalized team experiences and notifications.",
        NSUserNotificationUsageDescription: "This app sends notifications to keep you updated about team activities, posts, and important events.",
        UIBackgroundModes: [
          "remote-notification"
        ],
        CFBundleDisplayName: "COORA for Sport",
        CFBundleName: "COORA for Sport"
      }
    },
    android: {
      package: "com.coora.app.cooraforsport"
    },
    plugins: [
      "expo-font",
      "expo-splash-screen",
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./images/coora.icon.png",
          color: "#ffffff"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "2ddea270-61d0-4101-948b-e5ec57f5cfdc"
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  }
};
