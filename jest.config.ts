import type { Config } from 'jest'

const config: Config = {
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!eslint.config.js',
    '!jest.config.ts',
    '!__mocks__/**',
  ],
  preset: 'jest-expo',
  setupFiles: [
    './__mocks__/@react-native-async-storage/async-storage.js',
    './__mocks__/react-native-gesture-handler.js',
    './__mocks__/react-native-reanimated.js',
    './__mocks__/react-native-worklets.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|ky|standard-navigation)',
  ],
}

export default config
