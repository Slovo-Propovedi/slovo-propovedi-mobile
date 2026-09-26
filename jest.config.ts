import type { Config } from 'jest'

const config: Config = {
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!dist/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!eslint.config.js',
    '!jest.config.ts',
    '!__mocks__/**',
  ],
  preset: 'jest-expo',
  // Cap workers to a quarter of the machine's cores so test runs stay
  // responsive on low-resource machines (slower is fine, freezing is not).
  maxWorkers: '25%',
  // Recycle a worker once its resident memory crosses this threshold
  // (checked between test files). Primary OOM cap is --maxWorkers=2 in CI;
  // this prevents RSS accumulation across heavy jest-expo/RN suites.
  workerIdleMemoryLimit: '1GB',
  setupFiles: [
    // Must stay first: src/shared/config/env.ts validates EXPO_PUBLIC_* at module
    // load, and jest does not load .env.
    './__mocks__/env.js',
    './__mocks__/@react-native-async-storage/async-storage.js',
    './__mocks__/apk-installer.js',
    './__mocks__/expo-constants.js',
    './__mocks__/expo-haptics.js',
    './__mocks__/expo-image.js',
    './__mocks__/react-native-gesture-handler.js',
    './__mocks__/react-native-reanimated.js',
    './__mocks__/react-native-worklets.js',
  ],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // uuid resolves to its ESM build under jest-expo's custom export conditions
    // (['require', 'react-native']), so babel must transform it for jest's CJS runtime.
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|ky|standard-navigation|debounce|@faker-js|uuid)',
  ],
}

export default config
