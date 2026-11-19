import { playlistEngine } from './PlaylistEngine'

/**
 * The native queue is the source of truth for what is actually playing: during
 * the async JS reconciliation of a native switch the atom/storage still hold the
 * previous track. Resolve the URL of the engine's current track, falling back to
 * the caller's URL when the queue has no current track.
 * @param fallbackAudioUrl - URL from the possibly-stale JS state.
 */
export const resolveEngineAudioUrl = (fallbackAudioUrl: string): string => {
  const engineTrack = playlistEngine.getTrackAt(playlistEngine.getCurrentIndex())
  return engineTrack?.audioUrl ?? fallbackAudioUrl
}
