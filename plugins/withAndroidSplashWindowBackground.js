const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

// AppTheme (Theme.AppCompat.DayNight.NoActionBar) hiç windowBackground
// belirtmiyor — bu yüzden Android 12 altındaki cihazlarda (yeni SplashScreen
// API'sinin resmi olarak desteklenmediği), native splash ile RN içeriği
// arasındaki geçişte kısa bir an sistemin varsayılan (siyaha yakın) arka
// planı görünüyor. windowBackground'ı splash rengiyle aynı yaparak bu
// karartmayı ortadan kaldırıyoruz.
module.exports = function withAndroidSplashWindowBackground(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.setStylesItem({
      xml: config.modResults,
      parent: { name: 'AppTheme' },
      item: {
        _: '@color/splashscreen_background',
        $: { name: 'android:windowBackground' },
      },
    });
    return config;
  });
};
