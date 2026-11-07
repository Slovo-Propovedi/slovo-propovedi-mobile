import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentPlaylistAtom, setIsPlayingAction, setPositionAction } from '../../../model'
import { playlistEngine } from './PlaylistEngine'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

interface AdvanceDecision {
  completeRanges: Array<[number, number]>
  switchTo: number
}

/**
 * Completes every fully played track of an inclusive index range. Entries that
 * never got progress (JS frozen) are created as completed; `endDurationMs` is
 * only known for the track the native engine reports right now.
 * @param fromIndex - First queue index to complete.
 * @param toIndex - Last queue index to complete (inclusive).
 * @param endDurationMs - Duration of the track the engine reports right now.
 */
const completeTracks = async (fromIndex: number, toIndex: number, endDurationMs?: number) => {
  const playlist = ctx.get(currentPlaylistAtom) ?? undefined

  for (let index = Math.max(0, fromIndex); index <= toIndex; index += 1) {
    const track = playlistEngine.getTrackAt(index)
    if (!track) continue

    await markHistoryCompletedAction(
      ctx,
      track.id,
      index === toIndex ? endDurationMs : undefined,
      track,
      playlist,
    )
  }
}

/**
 * Completes the auto-advanced chain (repeat wrap included) and switches the
 * current audio to the track the engine plays now.
 * @param decision - Ranges that finished and the engine's current index.
 * @param jsIndex - Queue index JS still believes is playing.
 */
export const applyAdvanceDecision = async (
  decision: AdvanceDecision,
  jsIndex: number,
): Promise<void> => {
  for (const [fromIndex, toIndex] of decision.completeRanges)
    await completeTracks(fromIndex, toIndex)

  // Reuses the native auto-advance sync: atoms + storage + lock-screen metadata
  // + a fresh start entry for the track the engine is playing now.
  await trackAutoAdvanceService.handleTrackChanged(jsIndex, decision.switchTo)
}

/**
 * Manual native hop (headset/native next/prev): only the current track changes,
 * nothing finished and the previous track's progress is not flushed.
 * @param switchTo - Queue index the engine moved to.
 */
export const applyAdvanceManualDecision = async (switchTo: number): Promise<void> =>
  trackAutoAdvanceService.handleManualTrackChanged(switchTo)

/**
 * Queue finished natively: complete every track from the JS index to the last
 * one and mirror the engine's stopped state.
 * @param engineIndex - Index the native engine stopped on.
 * @param jsIndex - Queue index JS still believes is playing.
 * @param durationMs - Duration of the last track reported by the engine.
 */
export const applyIdleCompleteDecision = async (
  engineIndex: number,
  jsIndex: number,
  durationMs: number,
): Promise<void> => {
  const fromIndex = jsIndex === -1 ? engineIndex : Math.min(jsIndex, engineIndex)
  await completeTracks(fromIndex, engineIndex, durationMs)

  const status = playlistEngine.getStatus()
  void setIsPlayingAction(ctx, status.isPlaying)
  void setPositionAction(ctx, status.positionMs)
}
