/**
 * Минимальная форма проповеди для строки пикера: общие поля `SermonEntity`
 * (результаты поиска) и `PlaylistSermon` (уже включённые в плейлист).
 *
 * UI не должен зависеть от API-типов: строке нужны только id, обложка и
 * подпись Писания. `SermonEntity` и `PlaylistSermon` структурно удовлетворяют
 * этому типу, поэтому маппинг/приведение типов не требуются.
 */
export interface SermonOption {
  artist: string
  artwork: null | string
  book?: null | string
  chapter?: null | number | number[]
  id: string
  title: string
  verse?: (number | number[])[] | null | number | number[]
}
