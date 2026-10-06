import { action } from '@reatom/framework'
import { sectionsApi } from 'shared/api'
import {
  dynamicSectionsAtom,
  isLoadingSectionsAtom,
  type SectionData,
  type SectionDataSource,
  sectionDataSourceAtom,
} from '../model'
import { mapAllSectionsResponse } from './mappers/mapAllSectionsResponse'
import { getCachedSections } from './sections-cache/getCachedSections'
import { setCachedSections } from './sections-cache/setCachedSections'

/**
 * Latest-wins guard: the mount effect and `useOfflineRetry` can race, so a slow
 * older network response must not overwrite a newer one.
 */
let latestRequestId = 0

const readCache = async (): Promise<SectionData[] | undefined> => {
  try {
    return await getCachedSections()
  } catch (error) {
    console.error('Cache read failed:', error)
    return undefined
  }
}

export const fetchAllSections = action(async ctx => {
  const requestId = ++latestRequestId
  const cachedSections = await readCache()
  const hasCache = Boolean(cachedSections?.length)

  if (requestId !== latestRequestId) return

  // Stale-while-revalidate: cached content is shown instantly (no skeleton),
  // while the network request below always revalidates it.
  if (hasCache)
    await ctx.schedule(() => {
      dynamicSectionsAtom(ctx, cachedSections ?? [])
      sectionDataSourceAtom(ctx, 'cache')
      isLoadingSectionsAtom(ctx, false)
    })
  else
    await ctx.schedule(() => {
      isLoadingSectionsAtom(ctx, true)
    })

  let sections: SectionData[] = []
  let dataSource: SectionDataSource = 'unknown'

  try {
    const response = await sectionsApi.getSections().sectionControllerFindAll()
    if (requestId !== latestRequestId) return
    sections = mapAllSectionsResponse(response)
    dataSource = 'network'
  } catch (error) {
    console.error('fetchAllSections network failed:', error)
    if (requestId !== latestRequestId) return
    // Cache was already committed above — keep showing it instead of erroring.
    if (hasCache) return
  }

  // Empty network result with a non-empty cache: keep cached content on screen
  // and leave the cache untouched rather than flashing an empty state.
  if (sections.length === 0 && hasCache) return

  await ctx.schedule(() => {
    dynamicSectionsAtom(ctx, sections)
    sectionDataSourceAtom(ctx, dataSource)
    isLoadingSectionsAtom(ctx, false)
  })

  void setCachedSections(sections).catch(error => console.error('Cache write failed:', error))
}, 'fetchAllSections')
