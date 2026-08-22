# Building Locally

This document describes how to build the app locally without relying on EAS Cloud.
Local builds are the FLOSS-compliant path — no proprietary services required.

## Prerequisites

| Tool        | Version | Notes                                                 |
| ----------- | ------- | ----------------------------------------------------- |
| Node.js     | >= 22.x | Current LTS. Check with `node --version`.             |
| Yarn        | 1.22.x  | Classic Yarn. No `dlx` support.                       |
| JDK         | >= 17   | OpenJDK 17 or newer. Expo SDK 57 + React Native 0.86. |
| Android SDK | API 35+ | Install via Android Studio or `sdkmanager`.           |
| Xcode       | 16+     | macOS only. Required for iOS builds.                  |

## Android Release Build

### Quick Build (debug-signed)

```bash
yarn build-local-release:android
```

This runs `cd android && ./gradlew assembleProdRelease`.

The output APK is located at:

```
android/app/build/outputs/apk/prod/release/app-prod-release.apk
```

The exact file name may carry an `-unsigned` suffix depending on the
signing configuration.

> **Note:** By default, release builds use the debug keystore
> (`android/app/debug.keystore`). This is fine for development and
> testing, but **not accepted by Google Play or F-Droid**.

### Signing for Production

To publish to app stores, you need a **release keystore**. The current
`android/app/build.gradle` only defines a `debug` signing config:

```groovy
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}
```

To add a release signing config:

1. Generate a keystore:

   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore release.keystore \
     -alias my-key-alias \
     -keyalg RSA -keysize 2048 \
     -validity 10000
   ```

2. Place `release.keystore` in `android/app/`.

3. Add a `release` signing config to `android/app/build.gradle`:

   ```groovy
   // inside signingConfigs { ... } in android/app/build.gradle
   release {
       storeFile file('release.keystore')
       storePassword System.getenv("RELEASE_STORE_PASSWORD") ?: ''
       keyAlias System.getenv("RELEASE_KEY_ALIAS") ?: ''
       keyPassword System.getenv("RELEASE_KEY_PASSWORD") ?: ''
   }
   ```

4. Set environment variables or use `android/keystore.properties`.

For full details, see the
[Android signing guide](https://developer.android.com/build/publish/app-signing).

## iOS Release Build

iOS builds require **macOS** with Xcode installed.

```bash
yarn run:ios -- --configuration Release
```

Then use Xcode's **Archive** flow to create a signed build:

1. Open the project in Xcode.
2. Select **Product → Archive** from the menu.
3. Follow the Archive Organizer prompts to export the `.ipa`.

## Debug Build

For development testing on Android:

```bash
yarn build-local-debug:android
```

This runs `cd android && ./gradlew assembleDevDebug`.

Output: `android/app/build/outputs/apk/dev/debug/app-dev-debug.apk`

The dev build uses `applicationId = ru.slovopropovedi.dev` and the app name
«Dev Слово.Проповеди», so it installs side by side with the production app
(`ru.slovopropovedi`) and never overwrites it.

## Build Flavors (dev/prod)

The Android project defines two Gradle product flavors to keep the
development build separate from the production app on the same device:

| Flavor | Application ID          | App name            | Variants                   |
| ------ | ----------------------- | ------------------- | -------------------------- |
| `dev`  | `ru.slovopropovedi.dev` | Dev Слово.Проповеди | `devDebug`, `devRelease`   |
| `prod` | `ru.slovopropovedi`     | Слово.Проповеди     | `prodDebug`, `prodRelease` |

The `dev` flavor adds an `applicationIdSuffix` (`.dev`) and a
`versionNameSuffix` (`-dev`). Both flavors share the same launcher icon
(from `src/main/res`); per-flavor overrides can be added later under
`android/app/src/dev/res/` and `android/app/src/prod/res/`.

`yarn run:android` builds the `devDebug` variant by default — it installs
as a separate app and never overwrites the production build. To run the
prod variant locally: `yarn run:android:prod`.

`debuggableVariants` (in `android/app/build.gradle`, `react { }` block)
lists `devDebug` and `prodDebug` — these variants run JS from Metro
instead of embedding a bundle. Release variants bundle JS normally.

### Relaunching the Dev App (`yarn dev:launch`)

The dev flavor loads JS from Metro over `localhost:8081`, which requires
an `adb reverse` tunnel. That tunnel is ephemeral — it is lost when the
phone is re-plugged or adb restarts, and the app then shows a white
screen. To resume the dev app on the connected phone without a full
rebuild:

```bash
yarn dev:launch
```

This runs, in order:

1. `adb reverse tcp:8081 tcp:8081` — sets up the Metro reverse tunnel;
2. `adb shell am force-stop ru.slovopropovedi.dev` — force-stops the dev
   app so JS reloads from a clean state (fixes the white screen);
3. `adb shell am start -n ru.slovopropovedi.dev/ru.slovopropovedi.MainActivity`
   — relaunches the dev app's launcher activity.

Prerequisite: Metro must be running (`yarn start` in another terminal).
This works only for the dev flavor (package `ru.slovopropovedi.dev`).

## EAS Cloud Build (Alternative)

The following scripts depend on the proprietary EAS Cloud service and are
provided for convenience — they are **not** required:

| Script                       | Description                           |
| ---------------------------- | ------------------------------------- |
| `yarn build:android`         | Build Android with EAS Cloud          |
| `yarn build:ios`             | Build iOS with EAS Cloud              |
| `yarn build:all`             | Build all platforms with EAS Cloud    |
| `yarn build-preview:android` | Build Android (preview profile)       |
| `yarn build-preview:ios`     | Build iOS (preview profile)           |
| `yarn build-preview:all`     | Build all platforms (preview profile) |

These scripts are retained for users who choose to use EAS. The
`eas.json` file documents build profiles for reference.

EAS profiles use an explicit `gradleCommand` (see `eas.json`):
`development` → `:app:assembleDevDebug`, `preview` →
`:app:assembleProdRelease`, `production` → `:app:bundleProdRelease`.

## Troubleshooting

### Build fails: "SDK not found"

Ensure `ANDROID_HOME` is set and the SDK is installed:

```bash
echo $ANDROID_HOME
sdkmanager --list
```

### Build fails: "JDK version incompatible"

Expo SDK 57 requires JDK 17 or newer. Check your version:

```bash
java -version
```

### Build fails: "Gradle daemon already running"

```bash
cd android && ./gradlew --stop
```

### Build fails: "Could not resolve dependencies"

Ensure you have network access and try:

```bash
cd android && ./gradlew clean assembleProdRelease
```

### APK not found after build

Check the exact output path:

```bash
find android/app/build/outputs -name "*.apk" -o -name "*.aab"
```
