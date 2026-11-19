import { type Ctx } from '@reatom/framework'
import { getEntrySermon } from '../lib/getEntrySermon'
import { writeHistory } from '../lib/historyStorage'
import { type SermonProgressRecord, writeProgressRecords } from '../lib/progressStorage'
import { historyAtom } from './historyAtom'
import { sermonProgressAtom } from './progressAtom'
import { type ListeningHistory } from './types'

/**
 * Atomically commits a new history state: the atoms are updated synchronously
 * BEFORE persistence. JS is single-threaded, so an action's sync section
 * (read → transform → set) cannot interleave with another action's — lost
 * updates are impossible. AsyncStorage persistence (writeHistory +
 * writeProgressRecords, internally queued and error-tolerant) is a projection
 * of the atom state: on failure the atoms stay ahead and self-heal on the next
 * successful write.
 *
 * Every catalog entry is mirrored into the per-sermon progress store: the
 * catalog is capped at 100 entries, so without the mirror an eviction would
 * silently drop a sermon's «listened» indication. Existing progress keys are
 * kept — only entries present in `next` are overwritten.
 * @param ctx - Reatom context for synchronous atom writes.
 * @param next - The new history state to commit.
 */
export const commitHistory = async (ctx: Ctx, next: ListeningHistory): Promise<void> => {
  historyAtom(ctx, next)

  const progressRecords: Record<string, SermonProgressRecord> = {}
  for (const entry of next) {
    const sermonId = getEntrySermon(entry)?.id
    if (!sermonId) continue

    progressRecords[sermonId] = {
      durationMs: entry.durationMs,
      positionMs: entry.positionMs,
      updatedAt: entry.lastPlayedAt,
    }
  }
  sermonProgressAtom(ctx, { ...ctx.get(sermonProgressAtom), ...progressRecords })

  await writeHistory(next)
  await writeProgressRecords(progressRecords)
}
