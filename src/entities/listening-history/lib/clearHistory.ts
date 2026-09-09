import { action } from '@reatom/framework'
import { commitHistory } from '../model/commitHistory'
import { clearLiveProgressSnapshot } from './liveProgressStorage'

export const clearHistoryAction = action(async ctx => {
  await commitHistory(ctx, [])
  clearLiveProgressSnapshot()
}, 'clearHistory')
