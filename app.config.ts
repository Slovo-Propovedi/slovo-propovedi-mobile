import { type ConfigContext, type ExpoConfig } from 'expo/config'
import pkg from './package.json'

const appName = 'Слово.Проповеди'

// Mirrors scripts/bump-version.mjs and CI's EXPECTED_CODE math (major*10000+minor*100+patch);
// feeds both android.versionCode and ios.buildNumber.
const [major, minor, patch] = pkg.version.split('.').map(Number)
const versionCode = major * 10000 + minor * 100 + patch

const appId = 'ru.slovopropovedi'
const splashImageProps = {
  image: './assets/splash.png',
  imageWidth: 152,
  resizeMode: 'contain',
} as const

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    adaptiveIcon: { backgroundColor: '#f16031', foregroundImage: './assets/adaptive-icon.png' },
    // RECORD_AUDIO (microphone) is unused — playback-only via expo-audio. Stripped from the final
    // manifest even if a library/plugin re-adds it (expo-audio plugin injects it by default).
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    package: appId,
    permissions: [
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
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
