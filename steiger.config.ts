import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      'fsd/insignificant-slice': 'warn', // FIXME:  как будет время - перенести единожды используемые фичи по местам и включить правило обратно
    },
  },
  {
    files: ['./src/shared/api/generated/**'],
    rules: {
      'fsd/no-reserved-folder-names': 'off',
    },
  },
])
