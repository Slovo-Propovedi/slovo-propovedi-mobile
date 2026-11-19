import { action } from '@reatom/framework'
import { reportError } from 'shared/model/error-dialog'
import { isSermonForgotten } from '../model/forgottenSermons'
import { historyAtom, isHistoryLoadedAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { type ListeningHistory } from '../model/types'
import { deriveProgressRecords } from './deriveProgressRecords'
import { getEntrySermon } from './getEntrySermon'
import { readProgressRecords, writeProgressRecords } from './progressStorage'
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
  const wasLoaded = ctx.get(isHistoryLoadedAtom)
  try {
    const stored = sortAndCapEntries(await reconcileOnHydration())
    // After the first hydration the atom is authoritative: reloads are explicit
    // writes to disk (backup import) and must not blend in the previous state.
    const next = wasLoaded ? stored : mergeHydratedHistory(stored, ctx.get(historyAtom))

    const progressRecords = await readProgressRecords()
    // One-time legacy migration: the capped catalog used to be the only
    // progress carrier, so its entries are seeded into the unbounded
    // per-sermon store on the very first hydration. Repeated loads (backup
    // import) write progress explicitly and must not re-seed.
    const legacyRecords = wasLoaded ? undefined : deriveProgressRecords(next, progressRecords)

    await ctx.schedule(() => {
      historyAtom(ctx, next)
      // A playback flush may commit a fresher progress record between the disk
      // read and this scheduled write; the first hydration merges the atom so
      // that record is not clobbered by the snapshot it started from. Reloads
      // (backup import) treat the disk as the source of truth, like the catalog.
      const inMemoryRecords = wasLoaded ? {} : ctx.get(sermonProgressAtom)

      sermonProgressAtom(ctx, { ...progressRecords, ...legacyRecords, ...inMemoryRecords })
    })
    if (legacyRecords) await writeProgressRecords(legacyRecords)
  } catch (error) {
    console.error('Failed to load listening history:', error)
    reportError(error, 'Не удалось загрузить историю прослушивания')
  } finally {
    await ctx.schedule(() => {
      isHistoryLoadedAtom(ctx, true)
    })
  }
}, 'loadHistory')
