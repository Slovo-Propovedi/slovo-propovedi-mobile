import { action } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistory } from '../model/types'
import { completeSermonInHistory } from './completeSermonInHistory'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { sortAndCapEntries } from './sortAndCapEntries'

/**
 * Bulk variant of markSermonListenedAction: marks every sermon of a playlist
 * as listened in a single read-transform-write cycle.
 *
 * - Empty input → no-op (no writeHistory call).
 * - Applies the same per-sermon upsert semantics (completeSermonInHistory) for
 *   every sermon against one shared history snapshot.
 * - One final sort/cap pass, one `commitHistory` (sync atom set + write), one
 *   clearLiveProgressSnapshot — mirroring markSermonListenedAction's
 *   persistence order.
 */
export const markSermonsListenedAction = action(
  async (ctx, sermons: AudioPlayerData[], playlist: PlaylistData) => {
    if (sermons.length === 0) return

    const now = Date.now()
    let next: ListeningHistory = ctx.get(historyAtom)

    for (const sermon of sermons) next = completeSermonInHistory(next, sermon, playlist, now)

    next = sortAndCapEntries(next)

    await commitHistory(ctx, next)
    clearLiveProgressSnapshot()
  },
  'markSermonsListened',
)
