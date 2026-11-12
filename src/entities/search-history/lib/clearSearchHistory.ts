import { action } from '@reatom/framework'
import { commitSearchHistory } from '../model/commitSearchHistory'

export const clearSearchHistoryAction = action(async ctx => {
  await commitSearchHistory(ctx, [])
}, 'clearSearchHistory')
