import { action } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { upsertHistoryProgress } from './upsertHistoryProgress'

/**
 * Flushes real playback progress into the history catalog (UPSERT).
 *
 * Immediate flushes (pause, stop, 10s tick, app background) are statements of
 * REAL playback state → always write: create the entry if missing, and update
 * even completed entries (real listening supersedes a manual mark).
 * Deferred flushes (400ms seek-debounce) may be stale — the user can mark the
 * sermon listened during the debounce window — so they alone skip completed
 * entries.
 */
export const flushHistoryProgressAction = action(
  async (
    ctx,
    params: {
      deferred?: boolean
      durationMs: number
      playlist?: PlaylistData
      positionMs: number
      sermon: AudioPlayerData
    },
  ) => {
    if (params.positionMs <= 0) return

    const next = upsertHistoryProgress(ctx.get(historyAtom), params, Date.now())
    if (!next) return

    await commitHistory(ctx, next)
    clearLiveProgressSnapshot()
  },
  'flushHistoryProgress',
)
