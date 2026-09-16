import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { CACHED_SERMON_SEARCH, CACHED_SERMON_SEARCH_INDEX } from 'shared/config'
import { getCachedJson } from 'shared/lib/cache'
import { sermonSchema } from 'shared/model'
import { type SermonCandidate } from '../model'

const sermonsArraySchema = z.array(sermonSchema)
const SEARCH_CACHE_DATA_PREFIX = `${CACHED_SERMON_SEARCH}:`

export const collectSearchCandidates = async (): Promise<SermonCandidate[]> => {
  const allKeys = await AsyncStorage.getAllKeys()
  const searchKeys = allKeys.filter(
    key => key.startsWith(SEARCH_CACHE_DATA_PREFIX) && key !== CACHED_SERMON_SEARCH_INDEX,
  )

  const cachedLists = await Promise.all(
    searchKeys.map(key => getCachedJson(key, sermonsArraySchema)),
  )

  return cachedLists.flatMap(sermons => sermons?.map(sermon => ({ sermon })) ?? [])
}
