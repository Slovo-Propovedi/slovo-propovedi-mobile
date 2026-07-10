import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/shared/api/generated/**'],
    rules: {
      'fsd/no-reserved-folder-names': 'off',
    },
  },
])
