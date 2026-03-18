import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  expo: {
    entry: ['app/**/*.{ts,tsx}'],
  },

  ignore: [
    'src/pages/book-reader/testFiles/**',
    'src/pages/listen/mockData/**',
    'src/entities/player/lib/PlayerService/index.web.ts',
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
