import { type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

// expo-notifications injects com.google.firebase.messaging.* meta-data for FCM,
// which is unused, so it is stripped here. expo.modules.updates.* is deliberately
// NOT stripped: expo-updates is installed and its adjudication meta-data (update
// url, runtime version, request headers, code-signing setup) is what makes
// self-hosted OTA work. This mod is registered first in app.config.ts so it runs
// last (Expo executes manifest mods in reverse registration order), i.e. after
// every plugin that could add them. Idempotent: no-op when the entries are absent.
const REMOVED_META_DATA_PREFIXES = ['com.google.firebase.messaging.']

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
