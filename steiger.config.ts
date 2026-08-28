import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  // .agents/ — скиллы для AI-агентов, не часть FSD-структуры (иначе fsd/typo-in-layer-name примет его за слой)
  { ignores: ['**/.agents/**'] },
  // patches/ — patch-package патчи зависимостей, не часть FSD-структуры
  { ignores: ['**/patches/**'] },
  ...fsd.configs.recommended,
  {
    files: ['./src/shared/api/generated/**'],
    rules: {
      'fsd/no-reserved-folder-names': 'off',
    },
  },
])
