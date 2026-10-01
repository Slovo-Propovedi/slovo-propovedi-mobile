import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { togglePlaylistSermon } from './localPlaylistMembership'
import { FAVORITES_PLAYLIST, type LocalPlaylistData } from './localPlaylists'
import { myPlaylistsAtom } from './model'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const playlist = (id: string, sermonIds: string[] = []): LocalPlaylistData => ({
  id,
  sermonIds,
  title: id,
})

describe('togglePlaylistSermon', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('adds a sermon to the target playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await togglePlaylistSermon(ctx, 'a', 'sermon-1', true)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-1'])
  })

  test('removes a sermon from the target playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', ['sermon-1', 'sermon-2'])])

    await togglePlaylistSermon(ctx, 'a', 'sermon-1', false)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-2'])
  })

  test('can add sermons to favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    await togglePlaylistSermon(ctx, FAVORITES_PLAYLIST.id, 'sermon-1', true)

    expect(ctx.get(myPlaylistsAtom)[0].sermonIds).toEqual(['sermon-1'])
  })

  test('persists membership to myPlaylists storage', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await togglePlaylistSermon(ctx, 'a', 'sermon-1', true)

    const stored = await AsyncStorage.getItem(MY_PLAYLISTS_KEY)
    expect(JSON.parse(stored ?? '[]')).toEqual([FAVORITES_PLAYLIST, playlist('a', ['sermon-1'])])
  })

  test('is idempotent when adding an already-contained sermon', async () => {
    const ctx = createCtx()
    const a = playlist('a', ['sermon-1'])
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, a])

    await togglePlaylistSermon(ctx, 'a', 'sermon-1', true)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-1'])
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_KEY)).toBeNull()
  })

  test('is idempotent when removing a missing sermon', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', ['sermon-2'])])

    await togglePlaylistSermon(ctx, 'a', 'sermon-1', false)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-2'])
  })

  test('no-ops for an unknown playlist id', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await togglePlaylistSermon(ctx, 'ghost', 'sermon-1', true)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual([])
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_KEY)).toBeNull()
  })

  test('commits the atom even when persisting fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await expect(togglePlaylistSermon(ctx, 'a', 'sermon-1', true)).resolves.toBeDefined()

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-1'])
  })
})
