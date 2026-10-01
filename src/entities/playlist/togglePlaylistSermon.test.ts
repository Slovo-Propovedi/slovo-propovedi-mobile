import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { type SermonData } from 'entities/sermon'
import { togglePlaylistSermon } from './localPlaylistMembership'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  myPlaylistsArraySchema,
} from './localPlaylists'
import { myPlaylistsAtom } from './model'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const sermon = (id: string): SermonData => ({
  artist: 'Pastor',
  artwork: `https://cdn/${id}.jpg`,
  audioUrl: `https://cdn/${id}.mp3`,
  id,
  title: `Sermon ${id}`,
})

const playlist = (id: string, sermons: SermonData[] = []): LocalPlaylistData => ({
  id,
  sermonIds: sermons.map(item => item.id),
  sermons,
  title: id,
})

describe('togglePlaylistSermon', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('stores a sanitized sermon snapshot when adding', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    const draft = {
      ...sermon('sermon-1'),
      playlists: [{ artwork: null, id: 'favorites', sermons: [], title: 'Избранные' }],
    }
    await togglePlaylistSermon(ctx, 'a', draft, true)

    const stored = ctx.get(myPlaylistsAtom).find(p => p.id === 'a')
    expect(stored?.sermons).toEqual([sermon('sermon-1')])
    expect(stored?.sermonIds).toEqual(['sermon-1'])
  })

  test('keeps sermonIds derived from sermons on add and remove', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-1')])])

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-2'), true)
    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual([
      'sermon-1',
      'sermon-2',
    ])

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false)
    const afterRemove = ctx.get(myPlaylistsAtom).find(p => p.id === 'a')
    expect(afterRemove?.sermons).toEqual([sermon('sermon-2')])
    expect(afterRemove?.sermonIds).toEqual(['sermon-2'])
  })

  test('can add sermons to favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    await togglePlaylistSermon(ctx, FAVORITES_PLAYLIST.id, sermon('sermon-1'), true)

    expect(ctx.get(myPlaylistsAtom)[0].sermons).toEqual([sermon('sermon-1')])
  })

  test('persists the snapshot to myPlaylists storage', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)

    const stored = await AsyncStorage.getItem(MY_PLAYLISTS_KEY)
    expect(JSON.parse(stored ?? '[]')).toEqual([
      FAVORITES_PLAYLIST,
      playlist('a', [sermon('sermon-1')]),
    ])
  })

  test('is idempotent when adding an already-contained sermon', async () => {
    const ctx = createCtx()
    const a = playlist('a', [sermon('sermon-1')])
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, a])

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-1'])
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_KEY)).toBeNull()
  })

  test('is idempotent when removing a missing sermon', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-2')])])

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-2'])
  })

  test('no-ops for an unknown playlist id', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await togglePlaylistSermon(ctx, 'ghost', sermon('sermon-1'), true)

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual([])
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_KEY)).toBeNull()
  })

  test('commits the atom even when persisting fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await expect(togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)).resolves.toBeDefined()

    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual(['sermon-1'])
  })

  test('two rapid toggles both survive a slow first storage write', async () => {
    const defaultSetItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation()
    if (!defaultSetItem) throw new Error('AsyncStorage.setItem mock is not implemented')
    let releaseFirstWrite: () => void = () => {}
    const firstWriteBlocked = new Promise<void>(resolve => {
      releaseFirstWrite = resolve
    })
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementationOnce(async () => firstWriteBlocked)
      .mockImplementation((key, value) => defaultSetItem(key, value))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    const firstToggle = togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)
    const secondToggle = togglePlaylistSermon(ctx, 'a', sermon('sermon-2'), true)

    // The second toggle must compute from the first toggle's committed state,
    // not from the stale atom the first read before its slow write.
    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual([
      'sermon-1',
      'sermon-2',
    ])

    releaseFirstWrite()
    await Promise.all([firstToggle, secondToggle])

    const stored = JSON.parse((await AsyncStorage.getItem(MY_PLAYLISTS_KEY)) ?? '[]')
    expect(stored.find((p: LocalPlaylistData) => p.id === 'a')?.sermonIds).toEqual([
      'sermon-1',
      'sermon-2',
    ])
  })

  test('round-trips the persisted snapshot through the storage schema', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)

    const stored = await AsyncStorage.getItem(MY_PLAYLISTS_KEY)
    const parsed = myPlaylistsArraySchema.parse(JSON.parse(stored ?? '[]'))
    expect(parsed.find(p => p.id === 'a')?.sermons).toEqual([sermon('sermon-1')])
  })
})
