import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { currentAudioAtom, currentPlaylistAtom } from '../../../model'
import { flushProgress } from '../progressFlusher'
import { lockScreenControls } from './LockScreenControls'
import { playlistEngine } from './PlaylistEngine'
import {
  applyAdvanceDecision,
  applyAdvanceManualDecision,
  applyIdleCompleteDecision,
} from './reconcileApply'
import { decideForegroundReconcile, type ForegroundEngineSummary } from './reconcileDecision'

const RECONCILE_ERROR_MESSAGE = 'Не удалось восстановить состояние воспроизведения'

const readEngineState = (): ForegroundEngineSummary => {
  const status = playlistEngine.getStatus()
  const currentIndex = playlistEngine.getCurrentIndex()
  const trackCount = playlistEngine.getTrackCount()

  return {
    autoAdvanceCount: status.autoAdvanceCount,
    currentIndex,
    currentTrackId: playlistEngine.getTrackAt(currentIndex)?.id ?? null,
    didJustFinish: status.didJustFinish,
    durationMs: status.durationMs,
    engineTrackIds: Array.from(
      { length: trackCount },
      (_, index) => playlistEngine.getTrackAt(index)?.id ?? '',
    ),
    isLoaded: status.isLoaded,
    loop: playlistEngine.getLoop(),
    positionMs: status.positionMs,
    trackCount,
  }
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
    // Baseline JS last observed; the native counter lives in the engine summary.
    // A late trackChanged handled before this point bumps both, undercounting
    // the delta — the engine then equals the current track → `flush-current`.
    const jsKnownAutoAdvanceCount = playlistEngine.getAutoAdvanceCount()
    const currentAudioId = ctx.get(currentAudioAtom)?.id ?? null
    const playlistSermonIds = ctx.get(currentPlaylistAtom)?.sermons.map(s => s.id) ?? []
    const jsIndex = currentAudioId ? playlistSermonIds.indexOf(currentAudioId) : -1
    const decision = decideForegroundReconcile({
      currentAudioId,
      engine,
      jsKnownAutoAdvanceCount,
      playlistSermonIds,
    })

    if (decision.type === 'advance') await applyAdvanceDecision(decision, jsIndex)
    else if (decision.type === 'advance-manual') await applyAdvanceManualDecision(decision.switchTo)
    else if (decision.type === 'idle-complete')
      await applyIdleCompleteDecision(engine.currentIndex, jsIndex, engine.durationMs)
    else if (decision.type === 'flush-current') flushProgress(engine.positionMs, engine.durationMs)
    // `fallback` deliberately skips the flush: the engine track cannot be matched
    // to the JS one, so its position/duration must not be attributed to it.

    reassertLockScreenMetadata()
  } catch (error) {
    console.error('[reconcileOnForeground] failed:', error)
    reportError(error, RECONCILE_ERROR_MESSAGE)
  }
}
