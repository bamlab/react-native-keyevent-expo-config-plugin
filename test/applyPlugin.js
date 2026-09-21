// Test helper: run the config plugin's mods against a fixture source file,
// without needing a real Expo project on disk.
//
// `withAppDelegate` / `withMainActivity` register their action on
// `config.mods.<platform>.<mod>`. During a real `expo prebuild` the base mod
// reads the file from disk, puts it in `modResults` and calls the chain. Here we
// build `modResults` ourselves from a fixture, so the test exercises exactly the
// same anchoring / `mergeContents` code paths that prebuild does.

const path = require('path');
const fs = require('fs');

const plugin = require('../build/withReactNativeKeyevent').default;

const FIXTURES = path.join(__dirname, 'fixtures');

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function baseConfig() {
  return plugin({ name: 'keyevent-fixture', slug: 'keyevent-fixture' });
}

async function runMod({ platform, mod, modResults }) {
  const config = baseConfig();
  const modFn = config.mods[platform][mod];
  if (typeof modFn !== 'function') {
    throw new Error(`Plugin did not register a ${platform}.${mod} mod`);
  }
  const result = await modFn({
    ...config,
    modRequest: {
      projectRoot: '/fixture',
      platformProjectRoot: `/fixture/${platform}`,
      projectName: 'keyeventfixture',
      modName: mod,
      platform,
      introspect: false,
    },
    modResults,
  });
  return result.modResults.contents;
}

/** Run the iOS AppDelegate mods against a fixture AppDelegate source. */
function applyIos(fixtureName) {
  const language = fixtureName.endsWith('.swift') ? 'swift' : 'objcpp';
  return runMod({
    platform: 'ios',
    mod: 'appDelegate',
    modResults: {
      path: `/fixture/ios/HelloWorld/${fixtureName}`,
      contents: readFixture(fixtureName),
      language,
    },
  });
}

/** Run the Android MainActivity mods against a fixture MainActivity source. */
function applyAndroid(fixtureName) {
  const language = fixtureName.endsWith('.kt') ? 'kt' : 'java';
  return runMod({
    platform: 'android',
    mod: 'mainActivity',
    modResults: {
      path: `/fixture/android/app/src/main/java/com/helloworld/${fixtureName}`,
      contents: readFixture(fixtureName),
      language,
    },
  });
}

module.exports = { applyIos, applyAndroid, readFixture };
