import { action } from '@reatom/framework'
import { dynamicSectionsAtom, isLoadingSectionsAtom, sectionDataSourceAtom } from '../model'
import { getCachedSections } from './sections-cache/getCachedSections'

/**
 * Startup hydration: commits cached sections before the Listen tab mounts, so a
 * warm start shows content instead of flashing a skeleton. The read+commit runs
 * in a single scheduled transaction and never clobbers a fresher data source.
 */
export const hydrateCachedSections = action(async ctx => {
  const cachedSections = await getCachedSections().catch(error => {
    console.error('Cached sections read failed:', error)
    return undefined
  })

  if (!cachedSections?.length) return

  await ctx.schedule(scheduledCtx => {
    if (scheduledCtx.get(sectionDataSourceAtom) !== 'unknown') return
    if (scheduledCtx.get(dynamicSectionsAtom).length > 0) return

    dynamicSectionsAtom(scheduledCtx, cachedSections)
    sectionDataSourceAtom(scheduledCtx, 'cache')
    isLoadingSectionsAtom(scheduledCtx, false)
  })
}, 'hydrateCachedSections')
