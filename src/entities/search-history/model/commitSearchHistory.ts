import { type Ctx } from '@reatom/framework'
import { writeSearchHistory } from '../lib/searchHistoryStorage'
import { searchHistoryAtom } from './searchHistoryAtom'
import { type SearchHistory } from './types'

/**
 * Atomically commits a new search history state: the atom is updated
 * synchronously BEFORE persistence, so an action's sync section
 * (read → transform → set) cannot interleave with another action's — lost
 * updates are impossible. AsyncStorage persistence is a projection of the atom
 * state: on failure the atom stays ahead and self-heals on the next write.
 * @param ctx - Reatom context for synchronous atom writes.
 * @param next - The new search history state to commit.
 */
export const commitSearchHistory = async (ctx: Ctx, next: SearchHistory): Promise<void> => {
  searchHistoryAtom(ctx, next)
  await writeSearchHistory(next)
}
