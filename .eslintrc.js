/* eslint-disable */
const process = require('process');

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    '@feature-sliced',
    'plugin:storybook/recommended',
    'plugin:perfectionist/recommended-natural',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['jest', '@typescript-eslint', 'perfectionist'],
  env: {
    jest: true,
  },
  globals: { global: true },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    'import/no-internal-modules': [
      'warn',
      {
        allow: [
          '**/ui/*',
          'pages/*',
          'widgets/*',
          'features/*',
          'entities/*',
          'shared/*',
          'zustand/*',
          'zustand/**',
          '@testing-library/jest-native/extend-expect',
        ],
      },
    ],
    'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    curly: ['error', 'all'],
    'arrow-body-style': ['error', 'as-needed'],
    'perfectionist/sort-imports': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: ['../../'],
      },
    ],
  },
};
