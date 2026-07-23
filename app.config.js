// app.config.js — app.json yerine geçer, env değişkenlerini okur
module.exports = {
  expo: {
    name: 'SeyirLog',
    slug: 'seyirlog',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#1a1a2e',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.seyirlog.app',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1a1a2e',
      },
      package: 'com.seyirlog.app',
    },
    plugins: [
      'expo-router',
      ['expo-sqlite', { useSQLiteCPP: true }],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId:
            process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
            'ca-app-pub-3940256099942544~3347511713',
          iosAppId:
            process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
            'ca-app-pub-3940256099942544~1458002511',
        },
      ],
    ],
    scheme: 'seyirlog',
    extra: {
      router: { origin: false },
      eas: { projectId: 'f85f984c-c503-49a6-a139-f91e26e5c633' },
    },
    owner: 'ugura',
  },
};
