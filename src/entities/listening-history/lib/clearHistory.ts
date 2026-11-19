import { action } from '@reatom/framework'
import { commitHistory } from '../model/commitHistory'
import { sermonProgressAtom } from '../model/progressAtom'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { clearProgressRecords } from './progressStorage'

export const clearHistoryAction = action(async ctx => {
  await commitHistory(ctx, [])
  // commitHistory мержит старые ключи прогресса — сброс атома возможен только
  // после коммита, иначе очистка вернула бы удалённые записи прогресса.
  sermonProgressAtom(ctx, {})
  await clearProgressRecords()
  clearLiveProgressSnapshot()
}, 'clearHistory')
