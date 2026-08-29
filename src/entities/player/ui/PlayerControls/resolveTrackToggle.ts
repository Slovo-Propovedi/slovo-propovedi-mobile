import { RepeatMode } from '../../model'

export type TrackDirection = 'next' | 'prev'

export type TrackToggleTarget =
  | { boundary: 'first' | 'last'; kind: 'boundary' }
  | { kind: 'restart' }
  | { kind: 'switch'; newIndex: number; wrappedTo?: 'first' | 'last' }

/**
 * Определяет семантику тапа next/prev в зависимости от режима повтора.
 * @param dir - Направление переключения.
 * @param index - Индекс текущего трека.
 * @param totalTracks - Количество треков в плейлисте.
 * @param repeatMode - Режим повтора.
 * @returns Цель переключения: граница, рестарт или новый индекс.
 */
export const resolveTrackToggle = (
  dir: TrackDirection,
  index: number,
  totalTracks: number,
  repeatMode: RepeatMode,
): TrackToggleTarget => {
  const rawIndex = dir === 'next' ? index + 1 : index - 1
  const isOutOfBounds = rawIndex < 0 || rawIndex >= totalTracks

  if (repeatMode === RepeatMode.Track) return { kind: 'restart' }
  if (isOutOfBounds && repeatMode !== RepeatMode.Queue)
    return { boundary: dir === 'next' ? 'last' : 'first', kind: 'boundary' }

  const newIndex = ((rawIndex % totalTracks) + totalTracks) % totalTracks
  if (isOutOfBounds)
    return { kind: 'switch', newIndex, wrappedTo: dir === 'next' ? 'first' : 'last' }
  return { kind: 'switch', newIndex }
}
