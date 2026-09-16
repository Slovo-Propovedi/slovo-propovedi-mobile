import { type Ctx } from '@reatom/framework'
import { offlineRegistryAtom } from 'shared/lib/audio-cache'
import { type SermonCandidate } from '../model'

export const collectOfflineRegistryCandidates = (ctx: Ctx): SermonCandidate[] => {
  const registry = ctx.get(offlineRegistryAtom)

  return Object.values(registry).map(entry => ({
    playlist: entry.playlist ?? undefined,
    sermon: entry.sermon,
  }))
}
