export interface TrackCacheState {
  isCached: boolean
  isCacheDisabled: boolean
  isDownloading: boolean
  isQueued: boolean
  /**
   * Global «Кеширование проповедей» setting (`sermonCachingEnabledAtom`). Distinct
   * from `isCacheDisabled` (per-row action state): when off, the row hides every
   * cache indicator and offers no cache action at all.
   */
  isSermonCachingEnabled: boolean
  progressValue: number
  toggleCache: () => Promise<void>
  visualState: TrackCacheVisualState
}

/**
 * Контракт кэш-состояния строки трека. Строка получает состояние сверху пропсом
 * (top-down inversion), а сам хук `useTrackItemCache` живёт в соседней сущности
 * `entities/offline-cache`. Union структурно совпадает с `TrackCacheVisualState`
 * из `entities/offline-cache` — значение, посчитанное сущностью, подходит сюда.
 */
export type TrackCacheVisualState = 'cached' | 'cloud' | 'downloading' | 'playing' | 'queued'
