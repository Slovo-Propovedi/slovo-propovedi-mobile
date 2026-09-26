import { getCachedJson } from 'shared/lib/cache'
import { type SectionData, sectionsArraySchema } from '../../model'
import { CACHED_SECTIONS } from './cacheKey'

export const getCachedSections = async (): Promise<SectionData[] | undefined> =>
  getCachedJson(CACHED_SECTIONS, sectionsArraySchema)
