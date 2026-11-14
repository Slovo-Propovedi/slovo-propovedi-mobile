import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { mockConsole } from 'shared/mocks'
import { FAVORITES_PLAYLIST, type LocalPlaylistData } from './localPlaylists'
import { myPlaylistsAtom } from './model'
import { renameLocalPlaylist } from './renameLocalPlaylist'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const LOCAL_PLAYLIST: LocalPlaylistData = {
  id: 'local-1',
  sermonIds: [],
  sermons: [],
  title: 'Старое',
}

describe('renameLocalPlaylist', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('renames a local playlist in the atom', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await renameLocalPlaylist(ctx, 'local-1', 'Новое')

    expect(ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'local-1')?.title).toBe(
      'Новое',
    )
  })

  test('persists the new title', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await renameLocalPlaylist(ctx, 'local-1', 'Новое')

    const stored = JSON.parse((await AsyncStorage.getItem(MY_PLAYLISTS_KEY)) ?? '[]')
    expect(stored.find((playlist: { id: string }) => playlist.id === 'local-1').title).toBe('Новое')
  })

  test('never renames favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    await renameLocalPlaylist(ctx, FAVORITES_PLAYLIST.id, 'Переименованные')

    expect(ctx.get(myPlaylistsAtom)[0].title).toBe(FAVORITES_PLAYLIST.title)
  })

  test('ignores an unknown playlist id', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await renameLocalPlaylist(ctx, 'missing', 'Новое')

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.title)).toEqual([
      FAVORITES_PLAYLIST.title,
      'Старое',
    ])
  })

  test('keeps the atom renamed even when persisting fails', async () => {
    mockConsole('error')
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await renameLocalPlaylist(ctx, 'local-1', 'Новое')

    expect(ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'local-1')?.title).toBe(
      'Новое',
    )
  })
})
