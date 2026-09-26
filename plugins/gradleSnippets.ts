// Verbatim Gradle/XML snippets injected by the Android prebuild config plugins.
// They must match the committed android/ tree exactly so that
// `expo prebuild --platform android --clean` reproduces the same files.

export const DEBUGGABLE_VARIANTS_COMMENTED =
  '    // debuggableVariants = ["liteDebug", "prodDebug"]'

export const DEBUGGABLE_VARIANTS_ACTIVE = '    debuggableVariants = ["devDebug", "prodDebug"]'

export const PACKAGING_OPTIONS_ANCHOR = '    packagingOptions {'

export const APP_FLAVORS_BLOCK = `    flavorDimensions += "env"
    productFlavors {
        dev {
            dimension "env"
            applicationIdSuffix ".dev"
            versionNameSuffix "-dev"
        }
        prod {
            dimension "env"
        }
    }
`

export const APP_LINT_BLOCK = `    lint {
        checkReleaseBuilds = false
    }`

export const ANDROID_RESOURCES_BLOCK = `    androidResources {
        ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~'
    }`

export const LEGACY_PACKAGING_ANCHOR =
  '            useLegacyPackaging enableLegacyPackaging.toBoolean()'

export const WORKLETS_PICK_FIRSTS_BLOCK = `            // expo-modules-core resolves react-native-worklets through a CMake
            // IMPORTED target (prefab) and re-packages libworklets.so next to the
            // worklets module's own copy, so AGP's native-libs merger sees the same
            // library twice. Resolve it deterministically instead of failing with
            // "2 files found with path ..." (jniLibs vs IMPORTED targets).
            pickFirsts += [
                'lib/arm64-v8a/libworklets.so',
                'lib/armeabi-v7a/libworklets.so',
                'lib/x86/libworklets.so',
                'lib/x86_64/libworklets.so',
            ]`

export const EXPO_ROOT_PROJECT_ANCHOR = 'apply plugin: "expo-root-project"'

export const ROOT_SUBPROJECTS_BLOCK = `subprojects {
  afterEvaluate { project ->
    if (project.plugins.hasPlugin("com.android.library")) {
      project.android {
        lint {
          checkReleaseBuilds = false
        }
      }
    }
    // Disable lintVital tasks — checkReleaseBuilds=false does not prevent
    // lintVitalAnalyzeRelease from running, and it causes metaspace OOM.
    project.tasks.matching { it.name.startsWith('lintVital') }.configureEach {
      enabled = false
    }
  }
}

`

export const GRADLE_JVMARGS_KEY = 'org.gradle.jvmargs'

export const GRADLE_JVMARGS_VALUE = '-Xmx4096m -XX:MaxMetaspaceSize=2g'

export const KOTLIN_GITIGNORE_LINE = '.kotlin/'

export const DEV_APP_NAME_STRINGS = `<resources>
  <string name="app_name">Dev Слово.Проповеди</string>
</resources>
`

export const PROD_APP_NAME_STRINGS = `<resources>
  <string name="app_name">Слово.Проповеди</string>
</resources>
`

// Per-flavor custom URL schemes. The intent-filter is additive: the merger folds
// it into main's `.MainActivity`, so the fully-qualified name is required (flavor
// manifests cannot use relative names). Dev/prod must not share a scheme or a
// parallel install resolves `slovo-propovedi://` ambiguously.
//
// Dev is ALSO in the main manifest (withDevClientScheme): Expo CLI reads the
// dev-client launch scheme only from there. Prod strips it with the SECOND filter
// below — the merger coalesces filters whose action/category/data sets are
// identical (tools: attrs ignored), so it folds into main's dev filter and the
// data-level `tools:node="remove"` fires inside the merged filter, removing the
// <data>. The leftover VIEW filter (action/category, no data) is inert: VIEW
// without <data> matches no URI. The `slovo-propovedi` filter is untouched.
export const DEV_FLAVOR_MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <activity android:name="ru.slovopropovedi.MainActivity">
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="slovo-propovedi-dev"/>
      </intent-filter>
    </activity>
  </application>
</manifest>
`

export const PROD_FLAVOR_MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <application>
    <activity android:name="ru.slovopropovedi.MainActivity">
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="slovo-propovedi"/>
      </intent-filter>
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="slovo-propovedi-dev" tools:node="remove"/>
      </intent-filter>
    </activity>
  </application>
</manifest>
`
