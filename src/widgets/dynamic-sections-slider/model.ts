import { action, atom } from '@reatom/framework'
import { sectionsApi } from 'shared/api/generated'
import type { SectionData } from 'shared/model'

export const dynamicSectionsAtom = atom<SectionData[]>([], 'dynamicSectionsAtom')

export const fetchAllSections = action(async ctx => {
  const response = await sectionsApi.getSections().getAllSections()
  const sections = response.sections ?? []

  await ctx.schedule(() => {
    dynamicSectionsAtom(ctx, sections)
  })
}, 'fetchAllSections')
