/* eslint-disable */
const process = require('process');

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    '@feature-sliced',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['jest'],
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
          'routing/*',
          'pages/*',
          'widgets/*',
          'features/*',
          'entities/*',
          'shared/*',
          'zustand/*',
          'zustand/**',
        ],
      },
    ],
    'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    curly: ['error', 'all'],
    'arrow-body-style': ['error', 'as-needed'],
  },
};
