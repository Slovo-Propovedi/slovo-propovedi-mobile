import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, durationAtom } from '../../model'
import { savePlaybackProgress } from '../playbackProgress'

/** Coalesce frequent seeks (200ms long-press ticks) into one final history write. */
const SEEK_HISTORY_FLUSH_DEBOUNCE_MS = 400

let historyFlushTimeoutId: null | ReturnType<typeof setTimeout> = null

export const cancelScheduledHistoryFlush = (): void => {
  if (historyFlushTimeoutId) {
    clearTimeout(historyFlushTimeoutId)
    historyFlushTimeoutId = null
  }
}

export const flushProgress = (positionMs: number): void => {
  cancelScheduledHistoryFlush()
  const sermonId = ctx.get(currentAudioAtom)?.id
  if (!sermonId) return
  const durationMs = ctx.get(durationAtom)
  void savePlaybackProgress(ctx, { durationMs, positionMs, sermonId })
  void flushHistoryProgressAction(ctx, { durationMs, positionMs, sermonId })
}

export const scheduleHistoryFlush = (positionMs: number): void => {
  cancelScheduledHistoryFlush()

  const sermonId = ctx.get(currentAudioAtom)?.id
  if (!sermonId) return
  const durationMs = ctx.get(durationAtom)

  historyFlushTimeoutId = setTimeout(() => {
    historyFlushTimeoutId = null
    void flushHistoryProgressAction(ctx, {
      durationMs,
      positionMs,
      sermonId,
    })
  }, SEEK_HISTORY_FLUSH_DEBOUNCE_MS)
}
