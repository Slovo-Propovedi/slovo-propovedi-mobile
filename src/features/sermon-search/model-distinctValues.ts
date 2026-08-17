import { action, atom, type Ctx } from '@reatom/framework'
import { sermonsApi } from 'shared/api'
import {
  type DistinctValues,
  getCachedDistinctValues,
  setCachedDistinctValues,
} from './lib/distinctValuesCache'

export const distinctValuesAtom = atom<DistinctValues | null>(null, 'distinctValuesAtom')

let requestId = 0
let inFlight: null | Promise<void> = null

export const fetchDistinctValues = action(async ctx => {
  if (ctx.get(distinctValuesAtom) !== null) return
  if (inFlight) return inFlight

  const currentRequestId = ++requestId
  inFlight = loadDistinctValues(ctx, currentRequestId)
  try {
    await inFlight
  } finally {
    inFlight = null
  }
}, 'fetchDistinctValues')

const loadDistinctValues = async (ctx: Ctx, currentRequestId: number): Promise<void> => {
  try {
    const response = await sermonsApi.getSermons().sermonControllerGetDistinctValues()
    if (currentRequestId !== requestId) return

    const values: DistinctValues = { artists: response.artists, books: response.books }
    void setCachedDistinctValues(values).catch(error =>
      console.error('Distinct values cache write failed:', error),
    )
    await ctx.schedule(() => {
      distinctValuesAtom(ctx, values)
    })
  } catch (error) {
    console.error('fetchDistinctValues network failed:', error)
    if (currentRequestId !== requestId) return

    const cachedValues = await getCachedDistinctValues().catch(cacheError => {
      console.error('Distinct values cache read failed:', cacheError)
      return undefined
    })
    if (currentRequestId !== requestId || !cachedValues) return

    await ctx.schedule(() => {
      distinctValuesAtom(ctx, cachedValues)
    })
  }
}
