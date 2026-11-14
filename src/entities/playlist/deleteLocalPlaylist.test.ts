import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { mockConsole } from 'shared/mocks'
import { deleteLocalPlaylist } from './deleteLocalPlaylist'
import { FAVORITES_PLAYLIST, type LocalPlaylistData } from './localPlaylists'
import { myPlaylistsAtom } from './model'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const LOCAL_PLAYLIST: LocalPlaylistData = {
  id: 'local-1',
  sermonIds: [],
  sermons: [],
  title: 'Мой',
}

const OTHER_PLAYLIST: LocalPlaylistData = {
  id: 'local-2',
  sermonIds: [],
  sermons: [],
  title: 'Другой',
}

describe('deleteLocalPlaylist', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('removes the playlist from the atom, keeping favorites first', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST, OTHER_PLAYLIST])

    await deleteLocalPlaylist(ctx, 'local-1')

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      'local-2',
    ])
  })

  test('persists the deletion', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await deleteLocalPlaylist(ctx, 'local-1')

    const stored = JSON.parse((await AsyncStorage.getItem(MY_PLAYLISTS_KEY)) ?? '[]')
    expect(stored.map((playlist: { id: string }) => playlist.id)).toEqual([FAVORITES_PLAYLIST.id])
  })

  test('never deletes favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await deleteLocalPlaylist(ctx, FAVORITES_PLAYLIST.id)

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      'local-1',
    ])
  })

  test('ignores an unknown playlist id', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await deleteLocalPlaylist(ctx, 'missing')

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      'local-1',
    ])
  })

  test('keeps the atom updated even when persisting fails', async () => {
    mockConsole('error')
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await deleteLocalPlaylist(ctx, 'local-1')

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([FAVORITES_PLAYLIST.id])
  })
})
