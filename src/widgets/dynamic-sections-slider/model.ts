import { action, atom } from '@reatom/framework'
import { db } from 'shared/api/db/db'
import { sectionsApi } from 'shared/api/generated'
import type { SectionData } from 'shared/model'

export const dynamicSectionsAtom = atom<SectionData[]>([], 'dynamicSectionsAtom')
export const isLoadingSectionsAtom = atom(true, 'isLoadingSectionsAtom')

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

  let sections: SectionData[]

  try {
    const response = await sectionsApi.getSections().getAllSections()
    sections = (response.sections as SectionData[]) ?? []
  } catch {
    sections = getMockSections()
  }

  await ctx.schedule(() => {
    dynamicSectionsAtom(ctx, sections)
    isLoadingSectionsAtom(ctx, false)
  })
}, 'fetchAllSections')
