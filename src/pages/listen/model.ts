import { action, atom } from '@reatom/framework'
import { db, sectionsApi } from 'shared/api'
import { getCachedSections, setCachedSections } from 'shared/lib/sections-cache'
import { type SectionData } from 'shared/model'

export const dynamicSectionsAtom = atom<SectionData[]>([], 'dynamicSectionsAtom')
export const isLoadingSectionsAtom = atom(true, 'isLoadingSectionsAtom')

export type SectionDataSource = 'cache' | 'mock' | 'network' | 'unknown'
export const sectionDataSourceAtom = atom<SectionDataSource>('unknown', 'sectionDataSourceAtom')

const getMockSections = (): SectionData[] => {
  const { sermons: sermonsGroups } = db

  const newGroup = sermonsGroups.find(g => g.groupName === 'new')
  const onBibleGroup = sermonsGroups.find(g => g.groupName === 'onBible')
  const topicalGroup = sermonsGroups.find(g => g.groupName === 'topical')

  return [
    {
      id: 'mock-new',
      itemsSize: 'small',
      playlists: newGroup?.playlists ?? [],
      title: 'Новые',
      transform: 'middle',
    },
    {
      id: 'mock-on-bible',
      itemsSize: 'middle',
      playlists: onBibleGroup?.playlists ?? [],
      title: 'По библии',
      transform: 'middle',
    },
    {
      id: 'mock-topical',
      itemsSize: 'xLarge',
      playlists: topicalGroup?.playlists ?? [],
      title: 'Тематические',
      transform: 'middle',
    },
    {
      id: 'mock-listen-every-day',
      itemsSize: 'middle',
      playlists: onBibleGroup?.playlists ?? [],
      title: 'Слушать каждый день',
      transform: 'short',
    },
  ]
}

export const fetchAllSections = action(async ctx => {
  await ctx.schedule(() => {
    isLoadingSectionsAtom(ctx, true)
  })

  let sections: SectionData[] = []
  let dataSource: SectionDataSource = 'mock'

  try {
    try {
      const response = await sectionsApi.getSections().sectionControllerFindAll()
      sections = response.sections
      dataSource = 'network'
    } catch (error) {
      console.error('fetchAllSections network failed:', error)
      try {
        const cachedSections = await getCachedSections()
        if (cachedSections?.length) {
          sections = cachedSections
          dataSource = 'cache'
        } else {
          sections = getMockSections()
          dataSource = 'mock'
        }
      } catch (cacheError) {
        console.error('Cache read failed, using mock:', cacheError)
        sections = getMockSections()
        dataSource = 'mock'
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
