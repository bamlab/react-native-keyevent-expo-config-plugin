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

Verified on SDK 57: `npx expo prebuild --clean --platform android` on a fresh `create-expo-app`
project succeeds and `MainActivity.kt` contains both generated blocks.

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

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
