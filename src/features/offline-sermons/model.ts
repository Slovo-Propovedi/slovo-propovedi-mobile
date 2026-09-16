import { action, atom, type Ctx } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData, type SermonData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { collectSermonItems } from './lib/collectSermonItems'
import { filterCachedSermons } from './lib/filterCachedSermons'

export interface OfflineSermonItem {
  playlist: PlaylistData
  sermon: AudioPlayerData
}

export interface SermonCandidate {
  playlist?: PlaylistData
  sermon: SermonData
}

export const offlineSermonsAtom = atom<OfflineSermonItem[]>([], 'offlineSermonsAtom')
export const isLoadingOfflineSermonsAtom = atom(false, 'isLoadingOfflineSermonsAtom')

export const loadOfflineSermons = action(async (ctx: Ctx) => {
  await ctx.schedule(() => {
    isLoadingOfflineSermonsAtom(ctx, true)
  })

  try {
    const items = await filterCachedSermons(await collectSermonItems(ctx))

    await ctx.schedule(() => {
      offlineSermonsAtom(ctx, items)
    })
  } catch (error) {
    reportError(error, 'Не удалось загрузить список офлайн-проповедей')
  } finally {
    await ctx.schedule(() => {
      isLoadingOfflineSermonsAtom(ctx, false)
    })
  }
}, 'loadOfflineSermons')
