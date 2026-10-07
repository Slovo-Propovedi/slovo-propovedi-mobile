import AsyncStorage from '@react-native-async-storage/async-storage'
import { type PlaylistData } from 'entities/playlist'
import { CACHED_PLAYLIST_SEARCH, CACHED_PLAYLIST_SEARCH_INDEX } from 'shared/config'
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
      `${CACHED_PLAYLIST_SEARCH}:q:вера`,
      JSON.stringify([playlist]),
    )
  })

  test('does not cache an empty result array', async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

    await setCachedPlaylistSearch('вера', [])

    expect(setItemSpy).not.toHaveBeenCalledWith(
      `${CACHED_PLAYLIST_SEARCH}:q:вера`,
      expect.any(String),
    )
  })

  test('does not let the "index" query collide with the index key', async () => {
    await setCachedPlaylistSearch('вера', [playlist])
    await setCachedPlaylistSearch('index', [playlist])

    const index = JSON.parse((await AsyncStorage.getItem(CACHED_PLAYLIST_SEARCH_INDEX)) ?? '[]')

    expect(index).toEqual([`${CACHED_PLAYLIST_SEARCH}:q:вера`, `${CACHED_PLAYLIST_SEARCH}:q:index`])
    expect(await getCachedPlaylistSearch('вера')).toEqual([playlist])
    expect(await getCachedPlaylistSearch('index')).toEqual([playlist])
  })
})
