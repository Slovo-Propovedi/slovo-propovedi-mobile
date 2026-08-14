import type { SectionData } from '../../model/domain/common'
import { CACHED_SECTIONS } from '../../config/cache-storage-keys'
import { setCachedJson } from '../cache'

export const setCachedSections = async (sections: SectionData[]): Promise<void> =>
  setCachedJson(CACHED_SECTIONS, sections)
