export interface TrackCacheState {
  isCached: boolean
  isCacheDisabled: boolean
  isDownloading: boolean
  isQueued: boolean
  progressValue: number
  toggleCache: () => Promise<void>
  visualState: TrackCacheVisualState
}

/**
 * Контракт кэш-состояния строки трека. Shared-слой не может импортировать
 * entities/offline-cache, поэтому строка получает состояние сверху пропсом
 * (top-down inversion), а сам хук `useTrackItemCache` живёт в сущности.
 * Union структурно совпадает с `TrackCacheVisualState` из
 * entities/offline-cache — значение, посчитанное сущностью, подходит сюда.
 */
export type TrackCacheVisualState = 'cached' | 'cloud' | 'downloading' | 'playing' | 'queued'
