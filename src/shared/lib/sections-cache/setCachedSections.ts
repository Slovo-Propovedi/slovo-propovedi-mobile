import AsyncStorage from '@react-native-async-storage/async-storage'
import { CACHED_SECTIONS } from '../../config/cache-storage-keys'
import { type SectionData } from '../../model/domain/common'

export const setCachedSections = async (sections: SectionData[]): Promise<void> => {
  await AsyncStorage.setItem(CACHED_SECTIONS, JSON.stringify(sections))
}
