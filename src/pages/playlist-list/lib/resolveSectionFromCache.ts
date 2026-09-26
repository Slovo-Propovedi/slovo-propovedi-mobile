import { getCachedSections } from 'entities/section'

export const resolveSectionFromCache = async (sectionId: string) => {
  const cachedSections = await getCachedSections()
  return cachedSections?.find(s => s.id === sectionId)
}
