import { action } from '@reatom/framework'
import { reportError } from 'shared/model/error-dialog'
import { historyAtom, isHistoryLoadedAtom } from '../model/historyAtom'
import { reconcileOnHydration } from './reconcileOnHydration'
import { sortAndCapEntries } from './sortAndCapEntries'

export const loadHistoryAction = action(async ctx => {
  try {
    const sorted = sortAndCapEntries(await reconcileOnHydration())
    await ctx.schedule(() => {
      historyAtom(ctx, sorted)
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
