# Building Locally

This document describes how to build the app locally without relying on EAS Cloud.
Local builds are the FLOSS-compliant path — no proprietary services required.

## Prerequisites

| Tool        | Version        | Notes                                                 |
| ----------- | -------------- | ----------------------------------------------------- |
| Node.js     | >= 22.x        | Current LTS. Check with `node --version`.             |
| Yarn        | 1.22.x         | Classic Yarn. No `dlx` support.                       |
| JDK         | >= 17          | OpenJDK 17 or newer. Expo SDK 57 + React Native 0.86. |
| Android SDK | API 35+        | Install via Android Studio or `sdkmanager`.           |
| NDK         | 27.1.12297006  | Pinned by React Native 0.86 (`react-native/gradle/libs.versions.toml`). Install via `sdkmanager "ndk;27.1.12297006"`. |
| Xcode       | 16+            | macOS only. Required for iOS builds.                  |

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

Both flavors are applied on every `expo prebuild` by a local config plugin
(see [Prebuild и config-плагины](#prebuild-и-config-плагины) below), so the
committed `android/` folder is plugin-generated output rather than a
hand-maintained source tree.

- The `dev` flavor adds an `applicationIdSuffix` (`.dev`) and a
  `versionNameSuffix` (`-dev`), plus a per-flavor `app_name` string
  (`android/app/src/{dev,prod}/res/values/strings.xml`: «Dev
  Слово.Проповеди» / «Слово.Проповеди»).
- `debuggableVariants = ["devDebug", "prodDebug"]` — these variants run
  JS from Metro instead of embedding a bundle. Release variants bundle
  JS normally.
- `lint { checkReleaseBuilds = false }` disables release-build linting.

Both flavors share the same launcher icon (from `src/main/res`);
per-flavor overrides can be added later under `android/app/src/dev/res/`
and `android/app/src/prod/res/`.

`yarn run:android` builds the `devDebug` variant by default — it installs
as a separate app and never overwrites the production build. To run the
prod variant locally: `yarn run:android:prod`.

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

## Prebuild и config-плагины

`npx expo prebuild --platform android --clean` полностью регенерирует
`android/` из `app.config.ts` + плагинов — ручные правки в `android/`
делать НЕ нужно (и бессмысленно: затрутся). Все нативные кастомизации
Android воспроизводятся локальными config-плагинами:

- `plugins/withAndroidFlavors.ts` — product flavors `dev`/`prod`
  (`applicationIdSuffix ".dev"`, `versionNameSuffix "-dev"`),
  `debuggableVariants = ["devDebug", "prodDebug"]`,
  `lint { checkReleaseBuilds = false }`, `pickFirsts` для `libworklets.so`
  (4 ABI; конфликт из-за CMake IMPORTED target expo-modules-core) и
  per-flavor `strings.xml` («Dev Слово.Проповеди» / «Слово.Проповеди»).
- `plugins/withAndroidBuildMaintenance.ts` — отключение lint/lintVital\*
  для library-проектов в корневом `build.gradle`,
  `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=2g`, строка `.kotlin/`
  в `android/.gitignore`.

Все инъекции идемпотентны; повторный `prebuild --clean` даёт идентичное
дерево.

После prebuild манифест не содержит `expo.modules.updates.*` meta-data
(их инжектирует unversioned-плагин `@expo/prebuild-config` независимо от
наличия `expo-updates` — пакет фактически не установлен, его нет в
`yarn.lock`) и `com.google.firebase.messaging.*` meta-data: оба набора
удаляет `plugins/withAndroidManifestCleanup.ts`. Плагин зарегистрирован
первым в `app.config.ts`, т.к. manifest-моды применяются в обратном
порядке регистрации — так он выполняется после `expo-notifications` и
срезает его meta-data. `expo.autolinking.exclude: ["expo-updates"]` в
`package.json` оставлен как страховка (сейчас no-op). Разрешение
`POST_NOTIFICATIONS` объявлено явно в `android.permissions` в
`app.config.ts`.

`NODE_BINARY` — машинно-специфичная настройка, в плагин НЕ входит. Если
Gradle не видит node, добавить `NODE_BINARY=/usr/bin/node` (путь от
`which node`) в `~/.gradle/gradle.properties`.

> **Внимание:** свойства из `~/.gradle/gradle.properties` имеют приоритет
> над проектным `android/gradle.properties` — не задавайте там
> `org.gradle.jvmargs`, иначе локальное значение молча перекроет
> плагиновое.

CI: в `release.yml` шаг «Configure Gradle for CI» выполняется ПОСЛЕ
prebuild и перекрывает `jvmargs` значениями под 4 ГБ раннер; Android-релиз
собирается задачей `assembleProdRelease` из
`android/app/build/outputs/apk/prod/release/`.

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
