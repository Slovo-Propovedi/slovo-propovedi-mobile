import { resolveCacheState, type TrackCacheVisualState } from 'entities/offline-cache'

interface GetFullscreenVisualStateParams {
  isCached: boolean
  isCurrentAudioDownloading: boolean
  isQueued: boolean
}

// Cache visual state of the track shown in the fullscreen player.
export const getFullscreenVisualState = ({
  isCached,
  isCurrentAudioDownloading,
  isQueued,
}: GetFullscreenVisualStateParams): TrackCacheVisualState =>
  resolveCacheState({
    isCached,
    isDownloading: isCurrentAudioDownloading,
    isPlaying: false,
    isQueued,
  })
