import { type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

// Final manifest pass; each cleanup is idempotent (no-op when its target is already absent).
//
// 1. expo-notifications injects com.google.firebase.messaging.* meta-data for FCM, which is
//    unused, so it is stripped here. expo.modules.updates.* is deliberately NOT stripped:
//    expo-updates is installed and its adjudication meta-data (update url, runtime version,
//    request headers, code-signing setup) is what makes self-hosted OTA work.
// 2. android:screenOrientation="portrait" on .MainActivity is written by prebuild-config from
//    app.config.ts `orientation: 'portrait'`, which iOS needs. On Android a fixed orientation
//    forces size-compatibility mode in split-screen/multi-window: the window is scaled down with
//    black side bars (letterboxing) instead of resizing to the pane. Stripping the attribute
//    restores the default, so Android resizes the app to the available window.
//
// This mod is registered first in app.config.ts so it runs last (Expo executes manifest mods in
// reverse registration order), i.e. after every plugin that could add them, including the base
// prebuild-config mod that sets the orientation attribute.
const REMOVED_META_DATA_PREFIXES = ['com.google.firebase.messaging.']
const MAIN_ACTIVITY_NAME_SUFFIX = '.MainActivity'
const SCREEN_ORIENTATION_ATTRIBUTE = 'android:screenOrientation'

const isRemovedMetaData = (entry: { $: { 'android:name': string } }): boolean =>
  REMOVED_META_DATA_PREFIXES.some(prefix => entry.$['android:name'].startsWith(prefix))

export const withAndroidManifestCleanup: ConfigPlugin = config =>
  withAndroidManifest(config, manifestConfig => {
    const application = manifestConfig.modResults.manifest.application?.[0]

    if (!application) return manifestConfig

    const metaData = application['meta-data']

    if (metaData) application['meta-data'] = metaData.filter(entry => !isRemovedMetaData(entry))

    const mainActivity = application.activity?.find(activity =>
      activity.$['android:name'].endsWith(MAIN_ACTIVITY_NAME_SUFFIX),
    )

    if (!mainActivity) return manifestConfig

    delete mainActivity.$[SCREEN_ORIENTATION_ATTRIBUTE]

    return manifestConfig
  })
