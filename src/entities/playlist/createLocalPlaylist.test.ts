import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { mockConsole } from 'shared/mocks'
import { createLocalPlaylist } from './createLocalPlaylist'
import { FAVORITES_PLAYLIST } from './localPlaylists'
import { myPlaylistsAtom } from './model'

const MY_PLAYLISTS_KEY = 'myPlaylists'

describe('createLocalPlaylist', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('creates an id-only playlist pinned right after favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    const created = await createLocalPlaylist(ctx, { sermonIds: ['s-1', 's-2'], title: 'Мой' })

    expect(created.title).toBe('Мой')
    expect(created.sermonIds).toEqual(['s-1', 's-2'])
    expect(created.sermons).toEqual([])
    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      created.id,
    ])
  })

  test('creates a playlist with an explicit id when given one', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    const created = await createLocalPlaylist(ctx, {
      id: 'custom-0123456789abcdef',
      sermonIds: ['s-1'],
      title: 'Импорт',
    })

    expect(created.id).toBe('custom-0123456789abcdef')
    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      'custom-0123456789abcdef',
    ])
  })

  test('persists the new playlist after favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    const created = await createLocalPlaylist(ctx, { sermonIds: [], title: 'Пустой' })

    const stored = JSON.parse((await AsyncStorage.getItem(MY_PLAYLISTS_KEY)) ?? '[]')
    expect(stored.map((playlist: { id: string }) => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      created.id,
    ])
  })

  test('keeps the existing local playlists when adding another', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    const first = await createLocalPlaylist(ctx, { sermonIds: [], title: 'Первый' })
    const second = await createLocalPlaylist(ctx, { sermonIds: [], title: 'Второй' })

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      second.id,
      first.id,
    ])
  })

  test('commits the atom even when persisting fails', async () => {
    mockConsole('error')
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    const created = await createLocalPlaylist(ctx, { sermonIds: [], title: 'X' })

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      created.id,
    ])
  })
})
