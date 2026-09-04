import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  expo: {
    entry: ['app/**/*.{ts,tsx}'],
  },

  ignore: [
    'src/pages/book-reader/testFiles/**',
    'src/pages/listen/mockData/**',
    // Web-only platform variants — resolved by Metro/Jest by extension, invisible to knip.
    'src/entities/player/lib/PlayerService/index.web.ts',
    'src/entities/player/lib/PlayerService/webPlayerStubControls.ts',
    'src/shared/lib/audio-cache/AudioCacheService.web.ts',
    'src/shared/lib/audio-cache/webAudioDownload.ts',
    'src/shared/lib/audio-cache/webCacheApi.ts',
    'src/shared/lib/notifications/ensureNotifications.web.ts',
    'src/shared/model/file/mimeTypes.ts',
  ],

  ignoreUnresolved: ['expo-router/entry'],

  jest: true,

  project: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,js,tsx,jsx}'],

  rules: {
    dependencies: 'warn',
    devDependencies: 'warn',
    optionalPeerDependencies: 'warn',
    unlisted: 'off',
  },
}

export default config
