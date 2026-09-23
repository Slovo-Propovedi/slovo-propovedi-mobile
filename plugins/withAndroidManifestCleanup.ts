import { type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

// expo-notifications injects com.google.firebase.messaging.* meta-data for FCM, and
// Expo's unversioned expo-updates plugin injects expo.modules.updates.* even though
// expo-updates is not installed (and never is — updates ship through the self-hosted
// APK installer). Both sets are unused, so they are stripped here. This mod is
// registered first in app.config.ts so it runs last (Expo executes manifest mods in
// reverse registration order), i.e. after every plugin that could add them.
// Idempotent: no-op when the entries are absent.
const REMOVED_META_DATA_PREFIXES = ['com.google.firebase.messaging.', 'expo.modules.updates.']

const isRemovedMetaData = (entry: { $: { 'android:name': string } }): boolean =>
  REMOVED_META_DATA_PREFIXES.some(prefix => entry.$['android:name'].startsWith(prefix))

export const withAndroidManifestCleanup: ConfigPlugin = config =>
  withAndroidManifest(config, manifestConfig => {
    const application = manifestConfig.modResults.manifest.application?.[0]
    const metaData = application?.['meta-data']

    if (!application || !metaData) return manifestConfig

    application['meta-data'] = metaData.filter(entry => !isRemovedMetaData(entry))

    return manifestConfig
  })
