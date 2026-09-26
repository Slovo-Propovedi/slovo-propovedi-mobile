import { action, atom, type Ctx } from '@reatom/framework'
import { type PlaylistData } from 'entities/playlist'
import { reportError } from 'shared/model/error-dialog'
import type { AudioPlayerData, SermonData } from 'entities/sermon'
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
