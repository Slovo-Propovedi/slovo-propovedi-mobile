import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { CACHED_SECTIONS } from 'shared/config'
import { parseJsonWithSchema, sectionSchema } from 'shared/model'
import type { SectionData } from 'shared/model'

const sectionsArraySchema = z.array(sectionSchema)

export const getCachedSections = async (): Promise<SectionData[] | undefined> => {
  const json = await AsyncStorage.getItem(CACHED_SECTIONS)

  return parseJsonWithSchema(sectionsArraySchema)(json)
}

export const setCachedSections = async (sections: SectionData[]): Promise<void> => {
  await AsyncStorage.setItem(CACHED_SECTIONS, JSON.stringify(sections))
}
