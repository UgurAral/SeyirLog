const { withPodfile } = require('@expo/config-plugins');

// @react-native-firebase (Auth/Firestore) Objective-C headers use plain
// `#import <React/RCTBridgeModule.h>` instead of `@import React;`. With
// `use_frameworks! :linkage => :static` (required to build Firebase's Swift
// pods at all), Xcode's module verifier rejects that as a non-modular include
// and the build fails. React Native's own `react_native_post_install` helper
// does not set the flag that allows it, so it has to be added here.
const ANCHOR = ':ccache_enabled => ccache_enabled?(podfile_properties),\n    )';
const INJECTED = `${ANCHOR}

    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

module.exports = function withFirebaseModularHeadersFix(config) {
  return withPodfile(config, (config) => {
    const { contents } = config.modResults;
    if (!contents.includes(ANCHOR)) {
      throw new Error(
        'withFirebaseModularHeadersFix: expected Podfile post_install anchor not found — Expo\'s generated Podfile template must have changed, update plugins/withFirebaseModularHeadersFix.js',
      );
    }
    config.modResults.contents = contents.replace(ANCHOR, INJECTED);
    return config;
  });
};
