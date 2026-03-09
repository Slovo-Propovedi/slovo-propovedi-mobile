import comments from '@eslint-community/eslint-plugin-eslint-comments'
import css from '@eslint/css'
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'
import jsdoc from 'eslint-plugin-jsdoc'
import perfectionist from 'eslint-plugin-perfectionist'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactHooksExtra from 'eslint-plugin-react-hooks-extra'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import globals from 'globals'
import process from 'process'
import tseslint from 'typescript-eslint'
import i18next from 'eslint-plugin-i18next'

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

const ignoredConfigs = [
  'vite',
  'vitest',
  'prettier',
  'eslint',
  'steiger',
  'commitlint',
  'lint-staged',
  'orval',
]

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**/*',
      'tests/setup.ts',
      '**/*.{html,snap}',
      `{${ignoredConfigs.join(',')}}.config{,.d}.{ts,js,cjs,mjs}`,
      'env.ts',
      'env.d.ts',
      'knip.ts',
      'src/shared/api/generated/**/*',
      'src/pages/book-reader/testFiles/**',
      'babel.config.js',
      'jest.config.ts',
      '__mocks__/**/*',
    ],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      perfectionist.configs['recommended-alphabetical'],
      reactRefresh.configs.recommended,
      jsdoc.configs['flat/recommended'],
      i18next.configs['flat/recommended'],
    ],
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      prettier,
      sonarjs,
      import: importX,
      '@typescript-eslint': tseslint.plugin,
      'react-hooks-extra': reactHooksExtra,
      '@eslint-community/eslint-comments': comments,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      quotes: ['warn', 'single'],
      'linebreak-style': ['warn', process.platform === 'win32' ? 'windows' : 'unix'],
      semi: ['error', 'never', { beforeStatementContinuationChars: 'never' }],
      curly: ['error', 'multi'],
      'arrow-parens': ['error', 'as-needed'],
      'arrow-body-style': ['error', 'as-needed'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-control-regex': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: LAYERS.map(layer => ({
            group: [`../**/${layer}/`],
            message: `relative import ${layer} not allowed. Please use import from "${layer}/*".`,
          })),
        },
      ],
      'prefer-const': 'error',
      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: true,
        },
      ],
      camelcase: 'error',
      'max-lines': ['error', 130],
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-decorators': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-jsx-props': ['error', { type: 'line-length' }],
      'perfectionist/sort-variable-declarations': 'off',
      'perfectionist/sort-maps': ['error', { type: 'natural' }],
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
      'react-hooks-extra/no-direct-set-state-in-use-effect': 'warn',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/member-ordering': [
        'error',
        { default: ['signature', 'method', 'constructor', 'field'] },
      ],
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',

      'import/no-named-as-default': 'off',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'never',
          pathGroups: LAYERS.map(layer => ({
            pattern: `${layer}{,/**}`,
            group: 'internal',
            position: 'after',
          })),
          distinctGroup: false,
          pathGroupsExcludedImportTypes: ['builtin', 'type'],
          groups: ['builtin', 'external', 'internal', 'type', 'parent', 'sibling', 'index'],
        },
      ],
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      // 'import/no-unresolved': 'error',

      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/cognitive-complexity': 'error',

      'jsdoc/require-description-complete-sentence': [
        'error',
        {
          tags: ['see', 'copyright'],
        },
      ],
      'jsdoc/require-param': [
        'error',
        {
          checkDestructured: true,
        },
      ],
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/no-bad-blocks': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/require-returns': 'off',

      '@eslint-community/eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],

      'i18next/no-literal-string': 'warn',
    },
  },
)
