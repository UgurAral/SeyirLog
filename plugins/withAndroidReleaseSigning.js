const { withAppBuildGradle } = require('@expo/config-plugins');

// Google'ın önerdiği yöntem: gerçek imzalama şifrelerini build.gradle'a
// hardcode etmek yerine, git'e hiç girmeyen android/app/keystore.properties
// dosyasından okumak.
// https://developer.android.com/studio/publish/app-signing#secure-shared-keystore
// keystore.properties yoksa (CI/başka bir geliştiricide) release build sessizce
// debug keystore'a düşer — build kırılmaz.
const PROPERTIES_ANCHOR = "android {\n    ndkVersion rootProject.ext.ndkVersion";
const PROPERTIES_INJECTED = `def keystorePropertiesFile = file('keystore.properties')
def keystoreProperties = new Properties()
def hasReleaseKeystore = keystorePropertiesFile.exists()
if (hasReleaseKeystore) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

${PROPERTIES_ANCHOR}`;

const SIGNING_CONFIGS_ANCHOR = 'signingConfigs {\n        debug {';
const SIGNING_CONFIGS_INJECTED = `signingConfigs {
        release {
            if (hasReleaseKeystore) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
        debug {`;

const RELEASE_SIGNING_ANCHOR = `// Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;
const RELEASE_SIGNING_INJECTED = `// Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig hasReleaseKeystore ? signingConfigs.release : signingConfigs.debug`;

function replaceOrThrow(contents, anchor, injected, label) {
  // Non-clean prebuild re-runs this mod against an already-patched build.gradle
  // (the anchor text no longer exists, only our injected replacement does) —
  // treat that as already-applied rather than an error.
  if (contents.includes(injected)) {
    return contents;
  }
  if (!contents.includes(anchor)) {
    throw new Error(
      `withAndroidReleaseSigning: expected anchor for ${label} not found — Expo's generated android/app/build.gradle template must have changed, update plugins/withAndroidReleaseSigning.js`,
    );
  }
  return contents.replace(anchor, injected);
}

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let { contents } = config.modResults;
    contents = replaceOrThrow(contents, PROPERTIES_ANCHOR, PROPERTIES_INJECTED, 'properties loader');
    contents = replaceOrThrow(contents, SIGNING_CONFIGS_ANCHOR, SIGNING_CONFIGS_INJECTED, 'release signingConfig');
    contents = replaceOrThrow(contents, RELEASE_SIGNING_ANCHOR, RELEASE_SIGNING_INJECTED, 'release buildType signingConfig');
    config.modResults.contents = contents;
    return config;
  });
};
