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

export const fetchAllSections = action(async ctx => {
  await ctx.schedule(() => {
    isLoadingSectionsAtom(ctx, true)
  })

  let sections: SectionData[] = []
  let dataSource: SectionDataSource = 'unknown'

  try {
    try {
      const response = await sectionsApi.getSections().sectionControllerFindAll()
      sections = mapAllSectionsResponse(response)
      dataSource = 'network'
    } catch (error) {
      console.error('fetchAllSections network failed:', error)
      try {
        const cachedSections = await getCachedSections()
        if (cachedSections?.length) {
          sections = cachedSections
          dataSource = 'cache'
        }
      } catch (cacheError) {
        console.error('Cache read failed:', cacheError)
      }
    }

    await ctx.schedule(() => {
      dynamicSectionsAtom(ctx, sections)
      sectionDataSourceAtom(ctx, dataSource)
    })

    // Online-first: cache fresh data for offline use (fire-and-forget)
    void setCachedSections(sections).catch(error => console.error('Cache write failed:', error))
  } finally {
    await ctx.schedule(() => {
      isLoadingSectionsAtom(ctx, false)
    })
  }
}, 'fetchAllSections')
