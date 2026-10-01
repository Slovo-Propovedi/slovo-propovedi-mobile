import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { FAVORITES_PLAYLIST } from './localPlaylists'
import { myPlaylistsAtom, reorderMyPlaylists } from './model'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const playlist = (id: string) => ({ id, sermonIds: [], title: id })

describe('reorderMyPlaylists', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('reorders local playlists and keeps favorites pinned first', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a'), playlist('b'), playlist('c')])

    // Only local ids are dragged; dragging the favorites card to the top must
    // not move it — favorites stays pinned at index 0.
    await reorderMyPlaylists(ctx, ['a', 'c', 'favorites', 'b'])

    expect(ctx.get(myPlaylistsAtom).map(item => item.id)).toEqual(['favorites', 'a', 'c', 'b'])
  })

  test('persists the new order to myPlaylists storage', async () => {
    const ctx = createCtx()
    const a = playlist('a')
    const b = playlist('b')
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, a, b])

    await reorderMyPlaylists(ctx, ['b', 'a'])

    const stored = await AsyncStorage.getItem(MY_PLAYLISTS_KEY)
    expect(JSON.parse(stored ?? '[]')).toEqual([FAVORITES_PLAYLIST, b, a])
  })

  test('drops ids that are no longer present', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await reorderMyPlaylists(ctx, ['a', 'ghost'])

    expect(ctx.get(myPlaylistsAtom).map(item => item.id)).toEqual(['favorites', 'a'])
  })
})
