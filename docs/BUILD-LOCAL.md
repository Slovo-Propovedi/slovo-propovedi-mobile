# Building Locally

This document describes how to build the app locally without relying on EAS Cloud.
Local builds are the FLOSS-compliant path — no proprietary services required.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | >= 22.x | Current LTS. Check with `node --version`. |
| Yarn | 1.22.x | Classic Yarn. No `dlx` support. |
| JDK | >= 17 | OpenJDK 17 or newer. Expo SDK 57 + React Native 0.86. |
| Android SDK | API 35+ | Install via Android Studio or `sdkmanager`. |
| Xcode | 16+ | macOS only. Required for iOS builds. |

## Android Release Build

### Quick Build (debug-signed)

```bash
yarn build-local-release:android
```

This runs `cd android && ./gradlew assembleRelease`.

The output APK is located at:

```
android/app/build/outputs/apk/release/app-release.apk
```

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

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## EAS Cloud Build (Alternative)

The following scripts depend on the proprietary EAS Cloud service and are
provided for convenience — they are **not** required:

| Script | Description |
|--------|-------------|
| `yarn build:android` | Build Android with EAS Cloud |
| `yarn build:ios` | Build iOS with EAS Cloud |
| `yarn build:all` | Build all platforms with EAS Cloud |
| `yarn build-preview:android` | Build Android (preview profile) |
| `yarn build-preview:ios` | Build iOS (preview profile) |
| `yarn build-preview:all` | Build all platforms (preview profile) |
| `yarn update-app` | Deploy OTA update (requires EAS Cloud) |

These scripts are retained for users who choose to use EAS. The
`eas.json` file documents build profiles for reference. See
[OTA-STRATEGY.md](./OTA-STRATEGY.md) for details on OTA updates.

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
cd android && ./gradlew clean assembleRelease
```

### APK not found after build

Check the exact output path:

```bash
find android/app/build/outputs -name "*.apk" -o -name "*.aab"
```
