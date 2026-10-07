import AsyncStorage from '@react-native-async-storage/async-storage'
import { type PlaylistData } from 'entities/playlist'
import { CACHED_PLAYLIST_SEARCH } from 'shared/config'
import { getCachedPlaylistSearch, setCachedPlaylistSearch } from './playlistSearchCache'

const playlist: PlaylistData = {
  artwork: 'https://example.com/a.jpg',
  description: 'Описание',
  id: 'playlist-1',
  sermons: [],
  title: 'Плейлист о вере',
}

describe('playlistSearchCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('returns undefined when nothing is cached for the query', async () => {
    expect(await getCachedPlaylistSearch('вера')).toBeUndefined()
  })

  test('reads results written under the same normalized query', async () => {
    await setCachedPlaylistSearch('  ВеРА ', [playlist])

    expect(await getCachedPlaylistSearch('вера')).toEqual([playlist])
  })

  test('writes under the normalized query key', async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

    await setCachedPlaylistSearch('  ВеРА ', [playlist])

    expect(setItemSpy).toHaveBeenCalledWith(
      `${CACHED_PLAYLIST_SEARCH}:вера`,
      JSON.stringify([playlist]),
    )
  })

  test('does not cache an empty result array', async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

    await setCachedPlaylistSearch('вера', [])

    expect(setItemSpy).not.toHaveBeenCalledWith(
      `${CACHED_PLAYLIST_SEARCH}:вера`,
      expect.any(String),
    )
  })
})
