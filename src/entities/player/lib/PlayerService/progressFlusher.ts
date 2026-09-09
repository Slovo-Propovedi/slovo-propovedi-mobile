import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, currentPlaylistAtom, durationAtom } from '../../model'
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
  const audio = ctx.get(currentAudioAtom)
  if (!audio) return
  const playlist = ctx.get(currentPlaylistAtom)
  const durationMs = ctx.get(durationAtom)
  void savePlaybackProgress(ctx, { durationMs, positionMs, sermonId: audio.id })
  void flushHistoryProgressAction(ctx, {
    durationMs,
    playlist: playlist ?? undefined,
    positionMs,
    sermon: audio,
  })
}

export const scheduleHistoryFlush = (positionMs: number): void => {
  cancelScheduledHistoryFlush()

  const audio = ctx.get(currentAudioAtom)
  if (!audio) return
  const playlist = ctx.get(currentPlaylistAtom)
  const durationMs = ctx.get(durationAtom)

  historyFlushTimeoutId = setTimeout(() => {
    historyFlushTimeoutId = null
    void flushHistoryProgressAction(ctx, {
      deferred: true,
      durationMs,
      playlist: playlist ?? undefined,
      positionMs,
      sermon: audio,
    })
  }, SEEK_HISTORY_FLUSH_DEBOUNCE_MS)
}
