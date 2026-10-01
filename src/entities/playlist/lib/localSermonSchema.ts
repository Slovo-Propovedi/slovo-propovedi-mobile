import z from 'zod'
import { type SermonShape } from 'shared/model'

/**
 * Структурная схема снапшота проповеди внутри локального плейлиста.
 *
 * Канонический валидатор проповеди — `sermonDataSchema` из entities/sermon,
 * но импортировать его сюда нельзя: `sermon.ts` уже тянет
 * `playlistDataSchema`, и обратный импорт замыкает require-цикл
 * playlist ↔ sermon (см. Docs/architecture.md). Поэтому снапшот валидируется
 * структурной формой `SermonShape` — той же границей, что и `playlistDataSchema`
 * в model.ts. Поля перечислены честно: `audioUrl` остаётся nullable/optional
 * (проповедь без аудио), `playlists` — опционально.
 */
export const localSermonSchema = z.custom<SermonShape>(value => {
  if (typeof value !== 'object' || value === null) return false
  const sermon = value as Record<string, unknown>
  return (
    typeof sermon.id === 'string' &&
    typeof sermon.title === 'string' &&
    typeof sermon.artist === 'string' &&
    (sermon.artwork === null || typeof sermon.artwork === 'string')
  )
})
