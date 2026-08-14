import z from 'zod'
import { CACHED_SECTIONS } from '../../config/cache-storage-keys'
import { type SectionData, sectionSchema } from '../../model/domain/common'
import { getCachedJson } from '../cache'

const sectionsArraySchema = z.array(sectionSchema)

export const getCachedSections = async (): Promise<SectionData[] | undefined> =>
  getCachedJson(CACHED_SECTIONS, sectionsArraySchema)
