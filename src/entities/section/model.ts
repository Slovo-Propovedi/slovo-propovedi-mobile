import { action, atom } from '@reatom/framework'
import { mapAllSectionsResponse, sectionsApi } from 'shared/api'
import { getCachedSections, setCachedSections } from 'shared/lib/sections-cache'
import { type SectionData } from 'shared/model'

export const dynamicSectionsAtom = atom<SectionData[]>([], 'dynamicSectionsAtom')
export const isLoadingSectionsAtom = atom(true, 'isLoadingSectionsAtom')

export type SectionDataSource = 'cache' | 'network' | 'unknown'
export const sectionDataSourceAtom = atom<SectionDataSource>('unknown', 'sectionDataSourceAtom')

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
