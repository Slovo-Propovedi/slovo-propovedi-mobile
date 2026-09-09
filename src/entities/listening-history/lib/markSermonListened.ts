import { action } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { buildManualPlaylist } from './buildManualPlaylist'
import { completeSermonInHistory } from './completeSermonInHistory'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { sortAndCapEntries } from './sortAndCapEntries'

/**
 * Marks a sermon as listened: creates a completed history entry or completes
 * the existing one. Idempotent for already-completed entries.
 *
 * Unlike markHistoryCompletedAction (model/history.ts) — which is
 * player-internal and only completes an EXISTING entry with the real duration
 * (no-op without an entry) — this is a user-initiated upsert: it creates a
 * synthetic-completed entry (MANUAL_LISTENED_DURATION_MS) when none exists.
 * It lives in lib/ because model/history.ts is at its line limit
 * (eslint-disable max-lines).
 */
export const markSermonListenedAction = action(
  async (ctx, sermon: AudioPlayerData, playlist?: PlaylistData) => {
    const current = ctx.get(historyAtom)
    const next = sortAndCapEntries(
      completeSermonInHistory(current, sermon, playlist ?? buildManualPlaylist(sermon), Date.now()),
    )

    await commitHistory(ctx, next)
    clearLiveProgressSnapshot()
  },
  'markSermonListened',
)
