// Runs the config plugin against the real AppDelegate / MainActivity sources
// shipped by `expo-template-bare-minimum` for several Expo SDK versions, and
// asserts on the generated output.
//
// These tests encode the CURRENT behaviour of the plugin, including the known
// iOS breakage on SDK 53+ (see "iOS / Swift AppDelegate" below). They are meant
// to fail loudly if that behaviour changes in either direction.

const test = require('node:test');
const assert = require('node:assert/strict');

const { applyIos, applyAndroid } = require('./applyPlugin');

const OBJC_SDKS = ['51', '52'];
const SWIFT_SDKS = ['53', '54', '57'];
const ANDROID_SDKS = ['51', '52', '53', '54', '57'];

// ---------------------------------------------------------------------------
// Android / Kotlin MainActivity — works on every SDK tested
// ---------------------------------------------------------------------------

for (const sdk of ANDROID_SDKS) {
  test(`android: SDK ${sdk} MainActivity.kt gets both generated blocks`, async () => {
    const contents = await applyAndroid(`sdk${sdk}-MainActivity.kt`);

    assert.match(contents, /@generated begin react-native-keyevent-import/);
    assert.match(contents, /@generated end react-native-keyevent-import/);
    assert.match(contents, /@generated begin react-native-keyevent-body/);
    assert.match(contents, /@generated end react-native-keyevent-body/);

    assert.match(contents, /^import android\.view\.KeyEvent$/m);
    assert.match(contents, /^import com\.github\.kevinejohn\.keyevent\.KeyEventModule$/m);

    assert.match(contents, /override fun onKeyDown\(keyCode: Int, event: KeyEvent\): Boolean/);
    assert.match(contents, /override fun onKeyUp\(keyCode: Int, event: KeyEvent\): Boolean/);
    assert.match(
      contents,
      /override fun onKeyMultiple\(keyCode: Int, repeatCount: Int, event: KeyEvent\): Boolean/
    );
    assert.match(contents, /KeyEventModule\.getInstance\(\)\.onKeyDownEvent\(keyCode, event\)/);
    assert.match(contents, /KeyEventModule\.getInstance\(\)\.onKeyUpEvent\(keyCode, event\)/);
  });

  test(`android: SDK ${sdk} overrides land inside the MainActivity class body`, async () => {
    const contents = await applyAndroid(`sdk${sdk}-MainActivity.kt`);
    const classIndex = contents.indexOf('class MainActivity');
    const bodyIndex = contents.indexOf('@generated begin react-native-keyevent-body');
    assert.ok(classIndex > -1, 'fixture should declare `class MainActivity`');
    assert.ok(
      bodyIndex > classIndex,
      'generated body block must come after the class declaration'
    );
  });
}

test('android: applying the plugin twice is idempotent', async () => {
  const once = await applyAndroid('sdk57-MainActivity.kt');
  const countBlocks = (src, needle) => src.split(needle).length - 1;
  assert.equal(countBlocks(once, '@generated begin react-native-keyevent-body'), 1);
  assert.equal(countBlocks(once, '@generated begin react-native-keyevent-import'), 1);
});

// ---------------------------------------------------------------------------
// iOS / Objective-C++ AppDelegate — works on SDK 51 and 52
// ---------------------------------------------------------------------------

for (const sdk of OBJC_SDKS) {
  test(`ios: SDK ${sdk} AppDelegate.mm gets both generated blocks`, async () => {
    const contents = await applyIos(`sdk${sdk}-AppDelegate.mm`);

    assert.match(contents, /@generated begin react-native-keyevent-import/);
    assert.match(contents, /^#import <RNKeyEvent\.h>$/m);
    assert.match(contents, /@generated begin react-native-keyevent-body/);
    assert.match(contents, /RNKeyEvent \*keyEvent = nil;/);
    assert.match(contents, /- \(NSMutableArray<UIKeyCommand \*> \*\)keyCommands \{/);
    assert.match(contents, /- \(void\)keyInput:\(UIKeyCommand \*\)sender \{/);
  });
}

// ---------------------------------------------------------------------------
// iOS / Swift AppDelegate — KNOWN BROKEN on SDK 53+
//
// The plugin anchors its two iOS mods on Objective-C text:
//   - the import mod on `#import "AppDelegate.h"`
//   - the body mod on `@implementation AppDelegate`
// `expo-template-bare-minimum` ships `AppDelegate.swift` from SDK 53 onwards,
// so neither anchor exists and `mergeContents` throws ERR_NO_MATCH. This is
// what a user sees as a failed `expo prebuild --platform ios`.
//
// This test documents the breakage on purpose. If the plugin is ever ported to
// the Swift AppDelegate, this test should be rewritten to assert success.
// ---------------------------------------------------------------------------

for (const sdk of SWIFT_SDKS) {
  test(`ios: SDK ${sdk} AppDelegate.swift fails with ERR_NO_MATCH (known limitation)`, async () => {
    await assert.rejects(
      () => applyIos(`sdk${sdk}-AppDelegate.swift`),
      (error) => {
        assert.equal(error.code, 'ERR_NO_MATCH');
        assert.match(error.message, /Failed to match/);
        return true;
      }
    );
  });
}

test('ios: the Swift fixtures really do lack the Objective-C anchors', async () => {
  const { readFixture } = require('./applyPlugin');
  for (const sdk of SWIFT_SDKS) {
    const src = readFixture(`sdk${sdk}-AppDelegate.swift`);
    assert.doesNotMatch(src, /@implementation AppDelegate/);
    assert.doesNotMatch(src, /#import "AppDelegate\.h"/);
  }
});
