import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { mockConsole } from 'shared/mocks'
import { clearLocalPlaylistSermons } from './clearLocalPlaylistSermons'
import { FAVORITES_PLAYLIST, type LocalPlaylistData } from './localPlaylists'
import { myPlaylistsAtom } from './model'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const SERMON_1 = {
  artist: 'Автор',
  artwork: null,
  id: 'sermon-1',
  title: 'Первая',
}

const SERMON_2 = {
  artist: 'Автор',
  artwork: null,
  id: 'sermon-2',
  title: 'Вторая',
}

const LOCAL_PLAYLIST: LocalPlaylistData = {
  id: 'local-1',
  sermonIds: [SERMON_1.id, SERMON_2.id],
  sermons: [SERMON_1, SERMON_2],
  title: 'Мой',
}

const OTHER_PLAYLIST: LocalPlaylistData = {
  id: 'local-2',
  sermonIds: [SERMON_1.id],
  sermons: [SERMON_1],
  title: 'Другой',
}

describe('clearLocalPlaylistSermons', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('empties both sermon fields, keeping favorites first', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await clearLocalPlaylistSermons(ctx, 'local-1')

    const cleared = ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'local-1')
    expect(cleared?.sermonIds).toEqual([])
    expect(cleared?.sermons).toEqual([])
    expect(ctx.get(myPlaylistsAtom)[0].id).toBe(FAVORITES_PLAYLIST.id)
  })

  test('leaves other playlists untouched', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST, OTHER_PLAYLIST])

    await clearLocalPlaylistSermons(ctx, 'local-1')

    const other = ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'local-2')
    expect(other?.sermonIds).toEqual([SERMON_1.id])
    expect(other?.sermons).toEqual([SERMON_1])
  })

  test('persists the cleared playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await clearLocalPlaylistSermons(ctx, 'local-1')

    const stored = JSON.parse((await AsyncStorage.getItem(MY_PLAYLISTS_KEY)) ?? '[]')
    const storedLocal = stored.find((playlist: { id: string }) => playlist.id === 'local-1')
    expect(storedLocal.sermonIds).toEqual([])
    expect(storedLocal.sermons).toEqual([])
  })

  test('never clears favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await clearLocalPlaylistSermons(ctx, FAVORITES_PLAYLIST.id)

    expect(ctx.get(myPlaylistsAtom).map(playlist => playlist.id)).toEqual([
      FAVORITES_PLAYLIST.id,
      'local-1',
    ])
  })

  test('ignores an unknown playlist id', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await clearLocalPlaylistSermons(ctx, 'missing')

    expect(ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'local-1')?.sermonIds).toEqual(
      [SERMON_1.id, SERMON_2.id],
    )
  })

  test('keeps the atom updated even when persisting fails', async () => {
    mockConsole('error')
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, LOCAL_PLAYLIST])

    await clearLocalPlaylistSermons(ctx, 'local-1')

    expect(ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'local-1')?.sermonIds).toEqual(
      [],
    )
  })
})
