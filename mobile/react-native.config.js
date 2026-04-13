/**
 * React Native CLI configuration.
 * Required for autolinking to resolve the Android package name.
 * https://github.com/react-native-community/cli/blob/main/docs/configuration.md
 */
module.exports = {
  project: {
    android: {
      sourceDir: './android',
      packageName: 'com.arenafightpass',
    },
    ios: {
      sourceDir: './ios',
    },
  },
};
