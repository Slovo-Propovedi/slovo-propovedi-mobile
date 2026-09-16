import AsyncStorage from '@react-native-async-storage/async-storage'
import { CACHED_SERMON_SEARCH, CACHED_SERMON_SEARCH_INDEX } from 'shared/config'
import { type SermonData } from 'shared/model'
import { collectSearchCandidates } from './searchCandidates'

const mockSermon: SermonData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon 1',
}

describe('collectSearchCandidates', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  test('collects sermons from data keys and ignores the index key', async () => {
    await AsyncStorage.setItem(`${CACHED_SERMON_SEARCH}:query-a`, JSON.stringify([mockSermon]))
    await AsyncStorage.setItem(CACHED_SERMON_SEARCH_INDEX, JSON.stringify(['query-a']))

    const candidates = await collectSearchCandidates()

    expect(candidates).toHaveLength(1)
    expect(candidates[0].sermon.id).toBe('sermon-1')
    expect(candidates[0].playlist).toBeUndefined()
  })

  test('returns no candidates when only the index key exists', async () => {
    await AsyncStorage.setItem(CACHED_SERMON_SEARCH_INDEX, JSON.stringify(['query-a']))

    const candidates = await collectSearchCandidates()

    expect(candidates).toHaveLength(0)
  })
})
