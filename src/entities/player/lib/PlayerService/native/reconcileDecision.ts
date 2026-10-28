import { type AudioPlaylistLoopMode } from 'expo-audio'

export interface ForegroundEngineSummary {
  currentIndex: number
  currentTrackId: null | string
  durationMs: number
  isLoaded: boolean
  loop: AudioPlaylistLoopMode
  positionMs: number
  trackCount: number
}

export type ForegroundReconcileDecision = 'advance' | 'fallback' | 'flush-current' | 'idle-complete'

const TRACK_END_TOLERANCE_MS = 3000

const isQueueEnded = (engine: ForegroundEngineSummary): boolean => {
  if (engine.loop !== 'none' || engine.durationMs <= 0) return false
  if (engine.currentIndex !== engine.trackCount - 1) return false

  return engine.durationMs - engine.positionMs <= TRACK_END_TOLERANCE_MS
}

/**
 * Decides how to reconcile JS playback state with the native engine after JS
 * was suspended. Pure: the caller owns the actual history/atom mutations.
 * - `idle-complete` — the native queue finished while JS was frozen.
 * - `flush-current` — the engine still plays the sermon JS knows about.
 * - `advance` — the engine auto-advanced to a later track of the same queue.
 * - `fallback` — indices are unclear (unknown queue/playlist, repeat wrap or a
 *   backward jump); the caller skips the flush to avoid cross-track attribution.
 * @param root0 - Reconciliation inputs.
 * @param root0.currentAudioId - Sermon id the JS state believes is playing.
 * @param root0.engine - Native engine state summary.
 * @param root0.playlistSermonIds - Sermon ids of the JS queue in engine order.
 */
export const decideForegroundReconcile = ({
  currentAudioId,
  engine,
  playlistSermonIds,
}: {
  currentAudioId: null | string
  engine: ForegroundEngineSummary
  playlistSermonIds: string[]
}): ForegroundReconcileDecision => {
  if (!engine.isLoaded || engine.trackCount === 0) return 'fallback'
  if (isQueueEnded(engine)) return 'idle-complete'
  if (!engine.currentTrackId) return 'fallback'
  if (engine.currentTrackId === currentAudioId) return 'flush-current'

  const engineIndex = playlistSermonIds.indexOf(engine.currentTrackId)
  const jsIndex = currentAudioId ? playlistSermonIds.indexOf(currentAudioId) : -1
  if (engineIndex === -1 || jsIndex === -1 || engineIndex <= jsIndex) return 'fallback'

  return 'advance'
}
