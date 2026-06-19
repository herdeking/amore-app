const { withProjectBuildGradle } = require('@expo/config-plugins');

// Injects rootProject.ext.gradlePluginVersion (and other legacy ext vars)
// because @jitsi/react-native-sdk's build.gradle still reads it the old way,
// which Expo's modern prebuild template no longer sets by default.
const withJitsiGradleFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const marker = 'allprojects {';
      const inject = `
allprojects {
    ext {
        gradlePluginVersion = "8.4.2"
        minSdkVersion = 26
        compileSdkVersion = 36
        targetSdkVersion = 36
        kotlinVersion = "2.1.20"
    }
`;
      if (config.modResults.contents.includes('gradlePluginVersion')) {
        return config;
      }
      config.modResults.contents = config.modResults.contents.replace(marker, inject);
    }
    return config;
  });
};

module.exports = withJitsiGradleFix;
