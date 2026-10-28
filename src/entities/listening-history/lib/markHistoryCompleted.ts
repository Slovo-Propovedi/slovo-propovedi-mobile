import { action } from '@reatom/framework'
import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { type AudioPlayerData } from 'entities/sermon/@x/listening-history'
import { commitHistory } from '../model/commitHistory'
import { isSermonForgotten } from '../model/forgottenSermons'
import { historyAtom } from '../model/historyAtom'
import { buildManualPlaylist } from './buildManualPlaylist'
import { completeSermonInHistory } from './completeSermonInHistory'
import { getEntrySermon } from './getEntrySermon'
import { sortAndCapEntries } from './sortAndCapEntries'

// Player-internal completion of a sermon (upsert): it repairs entries left at
// 0/0 by an auto-advance that happened while JS was frozen. The user-initiated
// mark lives in lib/markSermonListened.ts.
export const markHistoryCompletedAction = action(
  async (
    ctx,
    sermonId: string,
    durationMs?: number,
    sermon?: AudioPlayerData,
    playlist?: PlaylistData,
  ) => {
    if (isSermonForgotten(sermonId)) return

    const current = ctx.get(historyAtom)
    const index = current.findIndex(e => getEntrySermon(e)?.id === sermonId)
    const liveDurationMs = durationMs !== undefined && durationMs > 0 ? durationMs : 0

    if (index === -1) {
      if (!sermon) return

      const contextPlaylist = playlist ?? buildManualPlaylist(sermon)
      const completed = completeSermonInHistory(current, sermon, contextPlaylist, Date.now())
      const withLiveDuration =
        liveDurationMs > 0
          ? completed.map(entry =>
              getEntrySermon(entry)?.id === sermonId
                ? { ...entry, durationMs: liveDurationMs, positionMs: liveDurationMs }
                : entry,
            )
          : completed

      await commitHistory(ctx, sortAndCapEntries(withLiveDuration))
      return
    }

    const entry = current[index]
    const finalDurationMs = liveDurationMs > 0 ? liveDurationMs : entry.durationMs

    // Unknown real duration → same synthetic completion as the manual mark.
    if (finalDurationMs === 0) {
      const entrySermon = getEntrySermon(entry)
      if (!entrySermon) return

      const contextPlaylist = playlist ?? buildManualPlaylist(entrySermon)
      const completed = completeSermonInHistory(current, entrySermon, contextPlaylist, Date.now())

      await commitHistory(ctx, sortAndCapEntries(completed))
      return
    }

    const updated = { ...entry, durationMs: finalDurationMs, positionMs: finalDurationMs }
    const next = [...current.slice(0, index), updated, ...current.slice(index + 1)]

    await commitHistory(ctx, next)
  },
  'markHistoryCompleted',
)
