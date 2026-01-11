module.exports = {
  expo: {
    name: 'OOTD AI',
    slug: 'ootd-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.ootdai.app',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.ootdai.app',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-dev-client',
    ],
    scheme: 'ootd-ai',
    owner: 'abpocnio',
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'c42e2d25-1e3d-49a0-b538-387cf9fc0f71',
      },
      // Environment variables are automatically available via EXPO_PUBLIC_ prefix
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      photoroomApiKey: process.env.EXPO_PUBLIC_PHOTOROOM_API_KEY,
    },
  },
};
