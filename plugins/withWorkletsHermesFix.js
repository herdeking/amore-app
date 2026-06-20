const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Patches react-native-worklets-core's CMakeLists.txt to link against
// hermes-engine::hermesvm on RN 0.82+, since the package still hardcodes
// the old hermes-engine::libhermes target name which no longer exists.
// See: https://github.com/margelo/react-native-worklets-core/issues/261
const withWorkletsHermesFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        'node_modules/react-native-worklets-core/android/CMakeLists.txt'
      );
      if (!fs.existsSync(filePath)) {
        return config;
      }
      let contents = fs.readFileSync(filePath, 'utf8');

      const oldBlock = `  target_link_libraries(
    \${PACKAGE_NAME}
    hermes-engine::libhermes
  )`;

      const newBlock = `  if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 82)
    target_link_libraries(
      \${PACKAGE_NAME}
      hermes-engine::hermesvm
    )
  else()
    target_link_libraries(
      \${PACKAGE_NAME}
      hermes-engine::libhermes
    )
  endif()`;

      if (contents.includes('hermes-engine::hermesvm')) {
        return config; // already patched
      }

      if (contents.includes(oldBlock)) {
        contents = contents.replace(oldBlock, newBlock);
        fs.writeFileSync(filePath, contents, 'utf8');
        console.log('[withWorkletsHermesFix] Patched CMakeLists.txt for hermesvm target');
      } else {
        console.warn('[withWorkletsHermesFix] Could not find expected block to patch - file may have changed upstream');
      }

      return config;
    },
  ]);
};

module.exports = withWorkletsHermesFix;
