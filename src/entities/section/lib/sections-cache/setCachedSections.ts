import { setCachedJson } from 'shared/lib/cache'
import { type SectionData } from '../../model'
import { CACHED_SECTIONS } from './cacheKey'

export const setCachedSections = async (sections: SectionData[]): Promise<void> =>
  setCachedJson(CACHED_SECTIONS, sections)
