const process = require('process');

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    '@feature-sliced',
    'plugin:perfectionist/recommended-natural',
    'plugin:sonarjs/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['jest', '@typescript-eslint', 'perfectionist', 'sonarjs'],
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
          '@testing-library/**',
          '@react-native-async-storage/**',
        ],
      },
    ],
    'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    curly: ['error', 'multi'],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-body-style': ['error', 'as-needed'],
    'react/prop-types': 'off',
    'react/no-unknown-property': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'perfectionist/sort-imports': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
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
    'sonarjs/cognitive-complexity': 'warn',
  },
};
