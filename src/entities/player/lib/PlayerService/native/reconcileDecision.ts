import { type AudioPlaylistLoopMode } from 'expo-audio'
import { buildCompletionRanges, hasSameQueueIdentity } from './reconcileChain'

export interface ForegroundEngineSummary {
  autoAdvanceCount: null | number
  currentIndex: number
  currentTrackId: null | string
  didJustFinish: boolean
  durationMs: number
  engineTrackIds: string[]
  isLoaded: boolean
  loop: AudioPlaylistLoopMode
  positionMs: number
  trackCount: number
}

export type ForegroundReconcileDecision =
  | { completeRanges: Array<[number, number]>; switchTo: number; type: 'advance' }
  | { switchTo: number; type: 'advance-manual' }
  | { type: 'fallback' }
  | { type: 'flush-current' }
  | { type: 'idle-complete' }

const TRACK_END_TOLERANCE_MS = 3000

const isQueueEnded = (engine: ForegroundEngineSummary): boolean => {
  if (engine.loop !== 'none' || engine.currentIndex !== engine.trackCount - 1) return false
  if (engine.didJustFinish) return true

  return engine.durationMs > 0 && engine.durationMs - engine.positionMs <= TRACK_END_TOLERANCE_MS
}

const decideByCounter = ({
  delta,
  engineIndex,
  jsIndex,
  trackCount,
}: {
  delta: number
  engineIndex: number
  jsIndex: number
  trackCount: number
}): ForegroundReconcileDecision => {
  if (delta < 0) return { type: 'fallback' }
  if (delta === 0) return { switchTo: engineIndex, type: 'advance-manual' }
  if (engineIndex !== (jsIndex + delta) % trackCount) return { type: 'fallback' }

  return {
    completeRanges: buildCompletionRanges(jsIndex, delta, trackCount),
    switchTo: engineIndex,
    type: 'advance',
  }
}

/**
 * Decides how to reconcile JS playback state with the native engine after JS
 * was suspended. Pure: the caller owns the actual history/atom mutations.
 * - `idle-complete` — the native queue finished while JS was frozen.
 * - `flush-current` — the engine still plays the sermon JS knows about.
 * - `advance` — the engine auto-advanced through `completeRanges` (possibly
 *   across a repeat wrap) and now plays `switchTo`.
 * - `advance-manual` — the engine hopped (headset/native prev/next) without a
 *   single auto-advance: nothing finished, only the current track switches.
 * - `fallback` — indices are unclear (unknown queue/playlist, a backward jump
 *   on a legacy binary, or a mixed manual+auto chain); the caller does nothing.
 * @param root0 - Reconciliation inputs.
 * @param root0.currentAudioId - Sermon id the JS state believes is playing.
 * @param root0.engine - Native engine state summary.
 * @param root0.jsKnownAutoAdvanceCount - Auto-advance count JS last observed.
 * @param root0.playlistSermonIds - Sermon ids of the JS queue in engine order.
 */
export const decideForegroundReconcile = ({
  currentAudioId,
  engine,
  jsKnownAutoAdvanceCount,
  playlistSermonIds,
}: {
  currentAudioId: null | string
  engine: ForegroundEngineSummary
  jsKnownAutoAdvanceCount: null | number
  playlistSermonIds: string[]
}): ForegroundReconcileDecision => {
  if (!engine.isLoaded || engine.trackCount === 0) return { type: 'fallback' }
  if (isQueueEnded(engine)) return { type: 'idle-complete' }
  if (!engine.currentTrackId) return { type: 'fallback' }
  if (engine.currentTrackId === currentAudioId) return { type: 'flush-current' }
  if (!hasSameQueueIdentity(engine.engineTrackIds, playlistSermonIds)) return { type: 'fallback' }

  const engineIndex = playlistSermonIds.indexOf(engine.currentTrackId)
  const jsIndex = currentAudioId ? playlistSermonIds.indexOf(currentAudioId) : -1
  if (engineIndex === -1 || jsIndex === -1) return { type: 'fallback' }

  const autoAdvanceCount = engine.autoAdvanceCount
  if (autoAdvanceCount === null || jsKnownAutoAdvanceCount === null) {
    if (engineIndex <= jsIndex) return { type: 'fallback' }

    return {
      completeRanges: [[jsIndex, engineIndex - 1]],
      switchTo: engineIndex,
      type: 'advance',
    }
  }

  return decideByCounter({
    delta: autoAdvanceCount - jsKnownAutoAdvanceCount,
    engineIndex,
    jsIndex,
    trackCount: playlistSermonIds.length,
  })
}
