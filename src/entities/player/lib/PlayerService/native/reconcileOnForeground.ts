import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  setIsPlayingAction,
  setPositionAction,
} from '../../../model'
import { flushProgress } from '../progressFlusher'
import { lockScreenControls } from './LockScreenControls'
import { playlistEngine } from './PlaylistEngine'
import { decideForegroundReconcile, type ForegroundEngineSummary } from './reconcileDecision'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

const RECONCILE_ERROR_MESSAGE = 'Не удалось восстановить состояние воспроизведения'

const readEngineState = (): ForegroundEngineSummary => {
  const status = playlistEngine.getStatus()
  const currentIndex = playlistEngine.getCurrentIndex()

  return {
    currentIndex,
    currentTrackId: playlistEngine.getTrackAt(currentIndex)?.id ?? null,
    durationMs: status.durationMs,
    isLoaded: playlistEngine.isLoaded(),
    loop: playlistEngine.getLoop(),
    positionMs: status.positionMs,
    trackCount: playlistEngine.getTrackCount(),
  }
}

/**
 * Completes every fully played track of the closed index range. Entries that
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

const reconcileAdvance = async (engineIndex: number, jsIndex: number): Promise<void> => {
  await completeTracks(jsIndex, engineIndex - 1)
  // Reuses the native auto-advance sync: atoms + storage + lock-screen metadata
  // + a fresh start entry for the track the engine is playing now.
  await trackAutoAdvanceService.handleTrackChanged(jsIndex, engineIndex)
}

const reconcileIdleComplete = async (
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

const reassertLockScreenMetadata = (): void => {
  const audio = ctx.get(currentAudioAtom)
  if (!audio || !playlistEngine.getStatus().isPlaying) return

  lockScreenControls.reassertMetadata(playlistEngine.getPlaylist(), {
    albumTitle: ctx.get(currentPlaylistAtom)?.title,
    artist: audio.artist,
    artworkUrl: audio.artwork,
    title: audio.title,
  })
}

/**
 * Foreground reconciliation: the native queue keeps playing while JS is frozen,
 * so track switches, queue completion and progress never reached JS. Runs once
 * per foreground return and repairs history + player atoms from the engine.
 */
export const reconcileOnForeground = async (): Promise<void> => {
  try {
    const engine = readEngineState()
    const currentAudioId = ctx.get(currentAudioAtom)?.id ?? null
    const playlistSermonIds = ctx.get(currentPlaylistAtom)?.sermons.map(s => s.id) ?? []
    const jsIndex = currentAudioId ? playlistSermonIds.indexOf(currentAudioId) : -1
    const decision = decideForegroundReconcile({ currentAudioId, engine, playlistSermonIds })

    if (decision === 'advance') await reconcileAdvance(engine.currentIndex, jsIndex)
    else if (decision === 'idle-complete')
      await reconcileIdleComplete(engine.currentIndex, jsIndex, engine.durationMs)
    else if (decision === 'flush-current') flushProgress(engine.positionMs, engine.durationMs)
    // `fallback` deliberately skips the flush: the engine track cannot be matched
    // to the JS one, so its position/duration must not be attributed to it.

    reassertLockScreenMetadata()
  } catch (error) {
    console.error('[reconcileOnForeground] failed:', error)
    reportError(error, RECONCILE_ERROR_MESSAGE)
  }
}
