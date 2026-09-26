import { type AndroidConfig, type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

const DEV_CLIENT_SCHEME = 'slovo-propovedi-dev'
const MAIN_ACTIVITY = '.MainActivity'
const VIEW_ACTION = 'android.intent.action.VIEW'
const DEFAULT_CATEGORY = 'android.intent.category.DEFAULT'
const BROWSABLE_CATEGORY = 'android.intent.category.BROWSABLE'

// Expo CLI resolves the dev-client launch scheme (`scheme://expo-development-client/?url=...`)
// only from the MAIN AndroidManifest.xml, via the chain @expo/cli utils/scheme.ts
// getSchemesForAndroidAsync → config-plugins Scheme.js getSchemesFromManifest. The latter reads
// filters only from activities with launchMode="singleTask" (.MainActivity holds it). Its
// predicate isValidRedirectIntentFilter accepts an intent-filter only when the actions
// include android.intent.action.VIEW and the categories do NOT include
// android.intent.category.LAUNCHER (Scheme.js:63-68); among the surviving schemes the CLI picks
// the longest one. So the dev scheme must sit in a VIEW filter that is not the launcher filter.
//
// It must NOT go on the MAIN/LAUNCHER filter: a <data> element constrains the filter to URIs, but
// the launcher intent (action MAIN, no URI) then no longer matches it — the dev app's launcher
// icon disappears from the device. Hence a dedicated VIEW + DEFAULT + BROWSABLE filter, shaped
// like the dev flavor manifest filter (see gradleSnippets.ts DEV_FLAVOR_MANIFEST).
//
// The prod flavor carries a `tools:node="remove"` marker for the same scheme in its VIEW filter
// (gradleSnippets.ts PROD_FLAVOR_MANIFEST); whether the merger coalesces the two VIEW filters and
// lets that marker fire is verified against the merged prod manifest.
//
// Idempotent: no-op when any VIEW-action filter already declares the dev scheme.
const MAIN_ACTIVITY_ERROR =
  'withDevClientScheme: .MainActivity not found in main AndroidManifest.xml'

const hasViewAction = (filter: AndroidConfig.Manifest.ManifestIntentFilter): boolean =>
  filter.action?.some(action => action.$['android:name'] === VIEW_ACTION) ?? false

const hasDevScheme = (filter: AndroidConfig.Manifest.ManifestIntentFilter): boolean =>
  filter.data?.some(entry => entry.$['android:scheme'] === DEV_CLIENT_SCHEME) ?? false

const isDevClientFilter = (filter: AndroidConfig.Manifest.ManifestIntentFilter): boolean =>
  hasViewAction(filter) && hasDevScheme(filter)

const buildDevClientFilter = (): AndroidConfig.Manifest.ManifestIntentFilter => ({
  action: [{ $: { 'android:name': VIEW_ACTION } }],
  category: [
    { $: { 'android:name': DEFAULT_CATEGORY } },
    { $: { 'android:name': BROWSABLE_CATEGORY } },
  ],
  data: [{ $: { 'android:scheme': DEV_CLIENT_SCHEME } }],
})

export const withDevClientScheme: ConfigPlugin = config =>
  withAndroidManifest(config, manifestConfig => {
    const activity = manifestConfig.modResults.manifest.application?.[0]?.activity?.find(
      entry => entry.$['android:name'] === MAIN_ACTIVITY,
    )

    if (!activity) throw new Error(MAIN_ACTIVITY_ERROR)

    const filters = activity['intent-filter'] ?? []

    if (filters.some(isDevClientFilter)) return manifestConfig

    activity['intent-filter'] = [...filters, buildDevClientFilter()]

    return manifestConfig
  })
