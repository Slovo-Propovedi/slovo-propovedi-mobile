import { action } from '@reatom/framework'
import { reportError } from 'shared/model/error-dialog'
import { isSermonForgotten } from '../model/forgottenSermons'
import { historyAtom, isHistoryLoadedAtom } from '../model/historyAtom'
import { type ListeningHistory } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { reconcileOnHydration } from './reconcileOnHydration'
import { sortAndCapEntries } from './sortAndCapEntries'

const dropForgotten = (entries: ListeningHistory): ListeningHistory =>
  entries.filter(entry => {
    const sermonId = getEntrySermon(entry)?.id
    return !sermonId || !isSermonForgotten(sermonId)
  })

// Hydration can race with playback writers (10s flush, completion): the atom is
// then fresher than the disk snapshot it started from. In-memory goes first so
// equal `lastPlayedAt` keeps the fresher progress (sortAndCapEntries keeps the
// first entry on a tie) and tombstones prevent deleted entries resurrecting.
const mergeHydratedHistory = (
  stored: ListeningHistory,
  inMemory: ListeningHistory,
): ListeningHistory => sortAndCapEntries([...dropForgotten(inMemory), ...dropForgotten(stored)])

export const loadHistoryAction = action(async ctx => {
  try {
    const stored = sortAndCapEntries(await reconcileOnHydration())
    // After the first hydration the atom is authoritative: reloads are explicit
    // writes to disk (backup import) and must not blend in the previous state.
    const next = ctx.get(isHistoryLoadedAtom)
      ? stored
      : mergeHydratedHistory(stored, ctx.get(historyAtom))

    await ctx.schedule(() => {
      historyAtom(ctx, next)
    })
  } catch (error) {
    console.error('Failed to load listening history:', error)
    reportError(error, 'Не удалось загрузить историю прослушивания')
  } finally {
    await ctx.schedule(() => {
      isHistoryLoadedAtom(ctx, true)
    })
  }
}, 'loadHistory')
