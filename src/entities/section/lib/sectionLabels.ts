import { type APITypes } from 'shared/api'

// Russian display labels for the section presentation enums. Shared by the
// admin list, detail and form screens so all three read the same wording
// (ported from the Svelte admin panel).
export const ITEMS_SIZE_LABELS: Record<APITypes.SectionEntity['itemsSize'], string> = {
  large: 'Большой',
  middle: 'Средний',
  small: 'Маленький',
  xLarge: 'Очень большой',
}

export const TRANSFORM_LABELS: Record<APITypes.SectionEntity['transform'], string> = {
  high: 'Высокий',
  middle: 'Средний',
  short: 'Низкий',
}

export const SLIDE_TITLE_LOCATION_LABELS: Record<
  NonNullable<APITypes.SectionEntity['whereIsSlideTitleLocated']>,
  string
> = {
  bothOnAndUnder: 'И на, и под слайдом',
  on: 'На слайде',
  under: 'Под слайдом',
}
