# @bam.tech/react-native-keyevent-expo-config-plugin

Config plugin to auto configure react-native-keyevent on prebuild

### Add the package to your npm dependencies

```
yarn add react-native-keyevent
yarn add --dev @bam.tech/react-native-keyevent-expo-config-plugin
```

In your `app.json` or equivalent, add the following;

```js
{
    expo: {
      /* ... */
      plugins: ['@bam.tech/react-native-keyevent-expo-config-plugin'],
    },
  }
```

## Supported Expo SDK versions

The peer dependency is `expo: ">=51"`. Older pinned ranges refused to install on recent SDKs, so the
range is deliberately open. That does **not** mean every SDK is equally supported:

| Platform | Expo SDK 51 / 52          | Expo SDK 53 and above      |
| -------- | ------------------------- | -------------------------- |
| Android  | works                     | works (verified on SDK 57) |
| iOS      | works (ObjC `AppDelegate`) | **broken** (Swift `AppDelegate`) |

### Android

The plugin patches `MainActivity.kt` (adds the `KeyEvent` / `KeyEventModule` imports and the
`onKeyDown` / `onKeyUp` / `onKeyMultiple` overrides). It emits Kotlin only, so a project that still
has a hand-written `MainActivity.java` is not supported: run the patch against a Kotlin
`MainActivity`, which is what Expo has generated since SDK 50.

Verified on SDK 57 (Expo 57.0.24, React Native 0.86.3), end to end on an Android emulator
(`Medium_Phone_API_36.1`, API 36, arm64):

1. `npx expo prebuild --clean --platform android` succeeds and `MainActivity.kt` contains both
   generated blocks.
2. `npx expo run:android` produces a successful Gradle build and installs the app.
3. Real hardware key presses injected into the running app reach JS through
   `KeyEvent.onKeyDownListener` / `onKeyUpListener`:

   | Key pressed  | `keyCode` seen in JS | `pressedKey` |
   | ------------ | -------------------- | ------------ |
   | Volume up    | `24`                 | -            |
   | Volume down  | `25`                 | -            |
   | `a`          | `29`                 | `a`          |
   | `z`          | `54`                 | `z`          |
   | Enter        | `66`                 | -            |
   | Back         | `4`                  | -            |

   Each press produced one `DOWN` and one `UP` event. Note that the generated `onKeyDown` /
   `onKeyUp` still call `super`, so a Back press also finishes the activity unless the app handles
   `hardwareBackPress` itself.

### iOS

The plugin patches `AppDelegate` by anchoring on `#import "AppDelegate.h"` and
`@implementation AppDelegate`. From SDK 53 onwards the Expo template ships an
`AppDelegate.swift` instead, so those anchors no longer match and `expo prebuild --platform ios`
fails with:

```
[ios.appDelegate]: withIosAppDelegateBaseMod: Failed to match "@implementation AppDelegate" in contents
```

Until the iOS mod is ported to Swift, iOS users on SDK 53+ need to add the `keyCommands` /
`keyInput:` handling to `AppDelegate.swift` by hand (see the
[react-native-keyevent iOS setup](https://github.com/kevinejohn/react-native-keyevent#ios)).

# Development

### Tests

```
yarn build
yarn test:plugin
```

`test/` runs the plugin's mods against the real `AppDelegate` / `MainActivity` sources shipped by
`expo-template-bare-minimum` for SDK 51, 52, 53, 54 and 57 (checked in under `test/fixtures/`) and
asserts on the generated output. The iOS SDK 53+ cases assert the **current, broken** behaviour
(`ERR_NO_MATCH`) on purpose: they are there so the breakage cannot go unnoticed, and they should be
rewritten if the iOS mod is ever ported to the Swift `AppDelegate`.

The tests use Node's built-in test runner and are deliberately independent of `yarn lint` /
`yarn test`, which are currently red on `main` for unrelated toolchain reasons (eslint 10 rejects
`.eslintrc.js`; `jest-expo` cannot resolve `jest/package.json`).

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
