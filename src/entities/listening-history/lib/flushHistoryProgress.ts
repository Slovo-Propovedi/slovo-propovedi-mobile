import { action } from '@reatom/framework'
import { historyAtom } from '../model/history'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { clearLiveProgressSnapshot } from './liveProgressStorage'

export const flushHistoryProgressAction = action(
  async (ctx, params: { durationMs: number; positionMs: number; sermonId: string }) => {
    if (params.positionMs <= 0) return

    const current = ctx.get(historyAtom)
    const index = current.findIndex(e => getEntrySermon(e).id === params.sermonId)
    if (index === -1) return

    const entry = current[index]
    if (params.positionMs <= entry.positionMs) return

    const updated = {
      ...entry,
      durationMs: params.durationMs > 0 ? params.durationMs : entry.durationMs,
      positionMs: params.positionMs,
    }
    const next = [...current.slice(0, index), updated, ...current.slice(index + 1)]

    await writeHistory(next)
    await ctx.schedule(() => {
      historyAtom(ctx, next)
    })
    clearLiveProgressSnapshot()
  },
  'flushHistoryProgress',
)
