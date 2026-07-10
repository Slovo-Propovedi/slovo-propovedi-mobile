import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { CACHED_SECTIONS } from '../../config/cache-storage-keys'
import { type SectionData, sectionSchema } from '../../model/domain/common'
import { getParseJsonWithSchema } from '../../model/getParseJsonWithSchema'

const sectionsArraySchema = z.array(sectionSchema)
const parseSectionsArray = getParseJsonWithSchema(sectionsArraySchema)

export const getCachedSections = async (): Promise<SectionData[] | undefined> => {
  const json = await AsyncStorage.getItem(CACHED_SECTIONS)

  return parseSectionsArray(json)
}
