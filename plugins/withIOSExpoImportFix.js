const { withAppDelegate } = require('@expo/config-plugins');

// SDK 54'ün AppDelegate.swift şablonu `internal import Expo` kullanıyor, ama
// otomatik-linklenen ExpoModulesProvider.swift (aynı hedefte derlenen) düz
// `import Expo` kullanıyor — bu iki dosya arasındaki access-level tutarsızlığı
// eski Swift derleyicilerinde sorun çıkarmıyordu, ama daha yeni/sıkı bir Swift
// araç zinciriyle (örn. güncel Xcode) "ambiguous implicit access level for
// import of 'Expo'; it is imported as 'internal' elsewhere" derleme hatasına
// dönüşüyor. AppDelegate'i otolinklenen dosyayla aynı (düz `import`) hizaya
// getirerek çözüyoruz. ios/ klasörü gitignored ve her `expo prebuild`'de
// şablondan yeniden üretildiği için bu düzeltme elle değil plugin ile kalıcı
// olmalı.
module.exports = function withIOSExpoImportFix(config) {
  return withAppDelegate(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /^internal import Expo$/m,
      'import Expo',
    );
    return config;
  });
};
