import { type Ctx } from '@reatom/framework'
import { writeHistory } from '../lib/historyStorage'
import { historyAtom } from './historyAtom'
import { type ListeningHistory } from './types'

/**
 * Atomically commits a new history state: the atom is updated synchronously
 * BEFORE persistence. JS is single-threaded, so an action's sync section
 * (read → transform → set) cannot interleave with another action's — lost
 * updates are impossible. AsyncStorage persistence (writeHistory, internally
 * queued and error-tolerant) is a projection of the atom state: on failure the
 * atom stays ahead and self-heals on the next successful write.
 * @param ctx - Reatom context for synchronous atom writes.
 * @param next - The new history state to commit.
 */
export const commitHistory = async (ctx: Ctx, next: ListeningHistory): Promise<void> => {
  historyAtom(ctx, next)
  await writeHistory(next)
}
