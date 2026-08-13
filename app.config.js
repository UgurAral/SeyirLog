// app.config.js — app.json yerine geçer, env değişkenlerini okur
module.exports = {
  expo: {
    name: 'SeyirLog',
    slug: 'seyirlog',
    version: '1.1.2',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.seyirlog.app',
      googleServicesFile: './GoogleService-Info.plist',
      buildNumber: '5',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1a1a2e',
      },
      package: 'com.seyirlog.app',
      "googleServicesFile": "./google-services.json",
      versionCode: 5,
    },

    plugins: [
      '@react-native-firebase/app',
      'expo-router',
      'expo-localization',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            // RNFB'nin Objective-C başlıkları React'ın <React/RCTBridgeModule.h>
            // gibi header'larını modüler olmayan şekilde import ediyor; framework
            // olarak derlenince bu bir hataya dönüşüyor. Bu pod'ları statik
            // kütüphane olarak linklemek (framework değil) sorunu çözüyor.
            forceStaticLinking: ['RNFBApp', 'RNFBAuth', 'RNFBFirestore'],
          },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#1a1a2e',
        },
      ],
      ['expo-sqlite', { useSQLiteCPP: true }],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'SeyirLog, tahminlerini iyileştirmek ve sefer başlatırken konumunuzu otomatik doldurmak için konumunuzu kullanır.',
        },
      ],
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication',
      './plugins/withFirebaseModularHeadersFix',
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
