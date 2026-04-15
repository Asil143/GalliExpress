/**
 * Fix manifest merger conflict between expo-notifications and @react-native-firebase/messaging.
 * Both packages declare com.google.firebase.messaging.default_notification_color.
 * This plugin adds tools:replace="android:resource" so our value wins.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNotificationColorFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Add xmlns:tools to the manifest root if not already present
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const app = manifest.manifest.application?.[0];
    if (!app) return config;

    const metaDataList = app['meta-data'] || [];
    for (const item of metaDataList) {
      if (
        item.$['android:name'] ===
        'com.google.firebase.messaging.default_notification_color'
      ) {
        item.$['tools:replace'] = 'android:resource';
      }
      if (
        item.$['android:name'] ===
        'com.google.firebase.messaging.default_notification_icon'
      ) {
        item.$['tools:replace'] = 'android:resource';
      }
    }

    return config;
  });
};
