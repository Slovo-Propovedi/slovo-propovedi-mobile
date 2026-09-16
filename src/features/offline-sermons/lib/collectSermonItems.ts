import { type Ctx } from '@reatom/framework'
import { collectCurrentPlayerCandidates } from './currentPlayerCandidates'
import { collectHistoryCandidates } from './historyCandidates'
import { type MergedSermonCandidate, mergeSermonCandidates } from './mergeSermonCandidates'
import { collectOfflineRegistryCandidates } from './offlineRegistryCandidates'
import { collectSearchCandidates } from './searchCandidates'
import { collectSectionCandidates } from './sectionsCandidates'

// Order encodes data quality: fresh full playlists (current player, cached
// sections) outrank the persistent offline registry; the registry (full
// playlists) beats slim history snapshots and search-only synthetic ones in
// dedupe.
export const collectSermonItems = async (ctx: Ctx): Promise<MergedSermonCandidate[]> => {
  const [historyCandidates, sectionCandidates, searchCandidates] = await Promise.all([
    collectHistoryCandidates(),
    collectSectionCandidates(),
    collectSearchCandidates(),
  ])

  return mergeSermonCandidates([
    ...collectCurrentPlayerCandidates(ctx),
    ...sectionCandidates,
    ...historyCandidates,
    ...collectOfflineRegistryCandidates(ctx),
    ...searchCandidates,
  ])
}
