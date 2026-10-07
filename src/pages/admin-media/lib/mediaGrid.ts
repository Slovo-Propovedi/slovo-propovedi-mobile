import { INDENTS } from 'shared/ui/theme'

// Целевой размер квадратной плитки: экран/плитка даёт 3 колонки на телефоне,
// больше — на планшете. Число колонок всегда ≥1, чтобы не делить на ноль.
const TARGET_TILE_SIZE = 120
const LIST_PADDING = INDENTS.medium * 2

/**
 * Геометрия сетки каталога медиа под ширину экрана: число колонок и размер
 * квадратной плитки.
 * @param width - Доступная ширина списка.
 */
export const measureMediaGrid = (width: number) => {
  const numColumns = Math.max(
    1,
    Math.floor((width - LIST_PADDING + INDENTS.low) / (TARGET_TILE_SIZE + INDENTS.low)),
  )
  const tileSize = Math.floor((width - LIST_PADDING - INDENTS.low * (numColumns - 1)) / numColumns)

  return { numColumns, tileSize }
}
