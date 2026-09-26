/**
 * Структурные формы доменных типов на границе shared-слоя.
 *
 * Канонические доменные типы и их zod-схемы живут в entities:
 *  - `SermonData`/`BookData` — entities/sermon;
 *  - `PlaylistData` — entities/playlist;
 *  - `SectionData` — entities/section.
 *
 * Здесь остаётся только минимальная loose-типизация тех мест внутри shared,
 * которым эти типы нужны, но которые не могут импортировать entities
 * (mock-БД и мапперы, работающие со `SermonShape`).
 */

/**
 * Структурная форма плейлиста на границе shared-слоя.
 * Канонический доменный тип — `PlaylistData` из entities/playlist.
 * Используется mock-БД (`FetchedPlaylist`) и структурной формой проповеди.
 */
export interface PlaylistShape {
  artwork: null | string
  description?: string | undefined
  id: string
  sections?: SectionShape[] | undefined
  sermons: SermonShape[]
  title: string
}

/**
 * Структурная форма секции на границе shared-слоя.
 * Канонический доменный тип — `SectionData` из entities/section.
 */
export interface SectionShape {
  borderRadius?: boolean | undefined
  description?: null | string | undefined
  id?: string | undefined
  isDescriptionTitleOnSlideLarge?: boolean | undefined
  itemsRows?: null | number | undefined
  itemsSize: 'large' | 'middle' | 'small' | 'xLarge'
  playlists?: PlaylistShape[] | undefined
  title?: string | undefined
  transform: 'high' | 'middle' | 'short'
  whereIsSlideTitleLocated?: 'bothOnAndUnder' | 'on' | 'under' | undefined
}

/**
 * Структурная форма проповеди на границе shared-слоя.
 * Канонический доменный тип — `SermonData` из entities/sermon; structural —
 * чтобы shared (mock-БД, мапперы) не импортировал entities.
 */
export interface SermonShape {
  artist: string
  artwork: null | string
  audioUrl?: null | string | undefined
  book?: null | string | undefined
  chapter?: null | number | number[] | undefined
  description?: string | undefined
  id: string
  playlists?: PlaylistShape[] | undefined
  textFileUrl?: null | string | undefined
  title: string
  verse?: (number | number[])[] | null | number | number[] | undefined
  youtubeUrl?: null | string | undefined
}
