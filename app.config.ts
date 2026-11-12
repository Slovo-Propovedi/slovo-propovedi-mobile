import { type ConfigContext, type ExpoConfig } from 'expo/config'
import { type ConfigPlugin } from 'expo/config-plugins'
import { OTA_CONFIG } from './ota.config.ts'
import pkg from './package.json'
import { withAndroidBuildMaintenance } from './plugins/withAndroidBuildMaintenance.ts'
import { withAndroidFlavors } from './plugins/withAndroidFlavors.ts'
import { withAndroidManifestCleanup } from './plugins/withAndroidManifestCleanup.ts'
import { withBackupRules } from './plugins/withBackupRules.ts'
import { withDebugKeystore } from './plugins/withDebugKeystore.ts'
import { withDevClientScheme } from './plugins/withDevClientScheme.ts'
import { withMavenCentralMirror } from './plugins/withMavenCentralMirror.ts'
import { withReleaseSigning } from './plugins/withReleaseSigning.ts'
import { ENV } from './src/shared/config/env.ts'

type AppConfig = { plugins?: AppPlugin[] } & Omit<ExpoConfig, 'plugins'>
// Expo types allow only string/array plugin entries; local config plugins are function refs.
type AppPlugin = ConfigPlugin | NonNullable<ExpoConfig['plugins']>[number]

const appName = 'Слово.Проповеди'

// Mirrors scripts/bump-version.mjs and CI's EXPECTED_CODE math; feeds versionCode/buildNumber.
const [major, minor, patch] = pkg.version.split('.').map(Number)
const versionCode = major * 10000 + minor * 100 + patch

const appId = 'ru.slovopropovedi'
// Android App Links host, validated with the rest of the EXPO_PUBLIC_* config in
// src/shared/config/env.ts (zod, no defaults — a missing var must fail prebuild rather than
// emit an unverifiable App Links host). The explicit .ts is required: the Expo config
// evaluator resolves neither tsconfig aliases nor extensionless specifiers (see ./plugins/*.ts).
const webHostname = ENV.webHostname
const splashImageProps = {
  image: './assets/splash.png',
  imageWidth: 152,
  resizeMode: 'contain',
} as const
const darkImageProps = { ...splashImageProps, image: './assets/dark-splash-icon.png' } as const

export default ({ config }: ConfigContext): AppConfig => ({
  ...config,
  android: {
    adaptiveIcon: { backgroundColor: '#f16031', foregroundImage: './assets/adaptive-icon.png' },
    // Auto-backup stays ENABLED for Seedvault / device-to-device migration; withBackupRules excludes
    // the expo-secure-store prefs file via dataExtractionRules / fullBackupContent.
    allowBackup: true,
    // RECORD_AUDIO (microphone) is unused — playback-only via expo-audio — and stripped from the
    // final manifest even if a library/plugin re-adds it (the expo-audio plugin injects it).
    // SYSTEM_ALERT_WINDOW (draw over other apps) comes from debug tooling; stripped from release
    // manifests (verified on the merged prodRelease one), dev overlays re-add it — expected there.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          { host: webHostname, path: '/listen', scheme: 'https' },
          { host: webHostname, path: '/listen/playlist', scheme: 'https' },
        ],
      },
    ],
    package: appId,
    permissions: [
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.REQUEST_INSTALL_PACKAGES',
    ],
    versionCode,
  },
  extra: { router: {} },
  icon: './assets/icon.png',
  ios: {
    buildNumber: String(versionCode),
    bundleIdentifier: appId,
    infoPlist: {
      CFBundleShortVersionString: '$(MARKETING_VERSION)',
      CFBundleVersion: '$(CURRENT_PROJECT_VERSION)',
      UIBackgroundModes: ['audio'],
    },
    supportsTablet: true,
  },
  name: appName,
  orientation: 'portrait',
  owner: 'egoreast',
  plugins: [
    // Runs last at mod-compile time: Expo executes manifest mods in reverse registration order, so
    // registering first makes the cleanup the final pass (after expo-notifications injects meta-data).
    withAndroidManifestCleanup,
    withBackupRules,
    withDevClientScheme,
    ['expo-audio', { enableBackgroundPlayback: true, recordAudioAndroid: false }],
    'expo-asset',
    ['expo-notifications', { color: '#f16031', icon: './assets/notification-icon.png' }],
    'expo-router',
    'expo-secure-store',
    'expo-sharing',
    'expo-status-bar',
    ['expo-navigation-bar', { enforceContrast: false }],
    'expo-image',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#f16031',
        dark: { backgroundColor: '#000000', ...darkImageProps },
        ...splashImageProps,
      },
    ],
    withAndroidFlavors,
    withAndroidBuildMaintenance,
    withMavenCentralMirror,
    withDebugKeystore,
    withReleaseSigning,
  ],
  ...OTA_CONFIG,
  slug: 'slovo-propovedi-mobile',
  userInterfaceStyle: 'automatic',
  version: pkg.version, // single source of truth (package.json); app.json is gone
  web: {
    bundler: 'metro',
    description: 'Аудио проповеди: слушайте онлайн и офлайн',
    favicon: './assets/favicon.jpg',
    lang: 'ru',
    name: appName,
    shortName: appName,
  },
})
