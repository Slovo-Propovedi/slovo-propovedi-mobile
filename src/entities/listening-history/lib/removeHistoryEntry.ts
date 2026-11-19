import { action } from '@reatom/framework'
import { commitHistory } from '../model/commitHistory'
import { forgetSermon } from '../model/forgottenSermons'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { getEntrySermon } from './getEntrySermon'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { removeProgressRecords } from './progressStorage'

export const removeHistoryEntryAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(historyAtom)
  const next = current.filter(e => getEntrySermon(e)?.id !== sermonId)

  if (next.length === current.length) return

  // Тамбстоун ставим ДО коммита: следующий flush, прочитавший атом после
  // удаления, уже увидит защиту и не воскресит запись.
  forgetSermon(sermonId)
  // Прогресс удаляемой проповеди снимается с атома до коммита: иначе merge в
  // commitHistory вернул бы ключ, а хук индикации показывал бы прогресс
  // проповеди, которой больше нет в истории.
  const progress = { ...ctx.get(sermonProgressAtom) }
  delete progress[sermonId]
  sermonProgressAtom(ctx, progress)

  await commitHistory(ctx, next)
  await removeProgressRecords([sermonId])
  clearLiveProgressSnapshot()
}, 'removeHistoryEntry')
