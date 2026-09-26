import { type ConfigContext, type ExpoConfig } from 'expo/config'
import { type ConfigPlugin } from 'expo/config-plugins'
import pkg from './package.json'
import { withAndroidBuildMaintenance } from './plugins/withAndroidBuildMaintenance.ts'
import { withAndroidFlavors } from './plugins/withAndroidFlavors.ts'
import { withAndroidManifestCleanup } from './plugins/withAndroidManifestCleanup.ts'
import { ENV } from './src/shared/config/env.ts'

type AppConfig = { plugins?: AppPlugin[] } & Omit<ExpoConfig, 'plugins'>
// Expo's config types only allow string/array plugin entries, but app.config
// may register local config plugins as function references — widen the list.
type AppPlugin = ConfigPlugin | NonNullable<ExpoConfig['plugins']>[number]

const appName = 'Слово.Проповеди'

// Mirrors scripts/bump-version.mjs and CI's EXPECTED_CODE math (major*10000+minor*100+patch);
// feeds both android.versionCode and ios.buildNumber.
const [major, minor, patch] = pkg.version.split('.').map(Number)
const versionCode = major * 10000 + minor * 100 + patch

const appId = 'ru.slovopropovedi'
// Android App Links host, validated together with the rest of the EXPO_PUBLIC_*
// config in src/shared/config/env.ts (zod, no defaults — a missing var must fail
// prebuild rather than emit an unverifiable App Links host). Relative import (the
// Expo config evaluator resolves neither tsconfig path aliases nor extensionless
// specifiers, hence the explicit .ts — same as the ./plugins/*.ts imports below).
// CI prebuild injects the env (see .forgejo/workflows/release.yml).
const webHostname = ENV.webHostname
const splashImageProps = {
  image: './assets/splash.png',
  imageWidth: 152,
  resizeMode: 'contain',
} as const

export default ({ config }: ConfigContext): AppConfig => ({
  ...config,
  android: {
    adaptiveIcon: { backgroundColor: '#f16031', foregroundImage: './assets/adaptive-icon.png' },
    // RECORD_AUDIO (microphone) is unused — playback-only via expo-audio. Stripped from the final
    // manifest even if a library/plugin re-adds it (expo-audio plugin injects it by default).
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
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
    infoPlist: { UIBackgroundModes: ['audio'] },
    supportsTablet: true,
  },
  name: appName,
  orientation: 'portrait',
  owner: 'egoreast',
  plugins: [
    // Runs last at mod-compile time: Expo executes manifest mods in reverse
    // registration order, so registering first makes the cleanup the final pass
    // (after expo-notifications injects the Firebase meta-data).
    withAndroidManifestCleanup,
    ['expo-audio', { enableBackgroundPlayback: true, recordAudioAndroid: false }],
    'expo-asset',
    ['expo-notifications', { color: '#f16031', icon: './assets/notification-icon.png' }],
    'expo-router',
    'expo-status-bar',
    ['expo-navigation-bar', { enforceContrast: false }],
    'expo-image',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#f16031',
        dark: { backgroundColor: '#000000', ...splashImageProps },
        ...splashImageProps,
      },
    ],
    withAndroidFlavors,
    withAndroidBuildMaintenance,
  ],
  scheme: 'slovo-propovedi',
  slug: 'slovo-propovedi-mobile',
  userInterfaceStyle: 'automatic',
  // Version comes from package.json (single source of truth); scripts/bump-version.mjs
  // bumps only package.json — app.json is gone.
  version: pkg.version,
  web: {
    bundler: 'metro',
    description: 'Аудио проповеди: слушайте онлайн и офлайн',
    favicon: './assets/favicon.jpg',
    lang: 'ru',
    name: appName,
    shortName: appName,
  },
})
