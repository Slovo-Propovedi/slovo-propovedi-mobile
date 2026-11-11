import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { currentAudioAtom, currentPlaylistAtom } from 'entities/player/@x/playlist'
import { type SermonData, toAudioPlayerData } from 'entities/sermon'
import { CURRENT_PLAYLIST } from 'shared/config'
import { mockConsole } from 'shared/mocks'
import { togglePlaylistSermon } from './localPlaylistMembership'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  MAX_CUSTOM_PLAYLIST_SERMONS,
  myPlaylistsArraySchema,
} from './localPlaylists'
import { myPlaylistsAtom } from './model'

const mockResetPlaybackAction = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/player/@x/playlist', () => {
  const actual = jest.requireActual('entities/player/@x/playlist')
  return {
    ...actual,
    resetPlaybackAction: (...args: unknown[]) => mockResetPlaybackAction(...args),
  }
})

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

// Плейлист в форме плеера (`currentPlaylistAtom`) — снапшот с обложкой.
const playerPlaylist = (id: string, sermonId: string) => ({
  artwork: null,
  id,
  sermons: [sermon(sermonId)],
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
    expect(stored?.sermons).toEqual([
      {
        ...sermon('sermon-1'),
        playlists: [{ artwork: null, id: 'favorites', sermons: [], title: 'Избранные' }],
      },
    ])
    expect(stored?.sermonIds).toEqual(['sermon-1'])
  })

  test('keeps sermonIds in sync on add and remove', async () => {
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

  test('preserves id-only members of an imported playlist on add and remove', async () => {
    const ctx = createCtx()
    const imported: LocalPlaylistData = {
      id: 'imported',
      sermonIds: ['a', 'b', 'c'],
      sermons: [],
      title: 'Импорт',
    }
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, imported])

    await togglePlaylistSermon(ctx, 'imported', sermon('new'), true)
    const afterAdd = ctx.get(myPlaylistsAtom).find(p => p.id === 'imported')
    expect(afterAdd?.sermonIds).toEqual(['a', 'b', 'c', 'new'])
    expect(afterAdd?.sermons).toEqual([sermon('new')])

    await togglePlaylistSermon(ctx, 'imported', sermon('b'), false)
    const afterRemove = ctx.get(myPlaylistsAtom).find(p => p.id === 'imported')
    expect(afterRemove?.sermonIds).toEqual(['a', 'c', 'new'])
    expect(afterRemove?.sermons).toEqual([sermon('new')])
  })

  test('round-trips id-only members through storage without losing them', async () => {
    const ctx = createCtx()
    const imported: LocalPlaylistData = {
      id: 'imported',
      sermonIds: ['a', 'b', 'c'],
      sermons: [],
      title: 'Импорт',
    }
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, imported])

    await togglePlaylistSermon(ctx, 'imported', sermon('new'), true)

    const stored = await AsyncStorage.getItem(MY_PLAYLISTS_KEY)
    const parsed = myPlaylistsArraySchema.parse(JSON.parse(stored ?? '[]'))
    expect(parsed.find(p => p.id === 'imported')?.sermonIds).toEqual(['a', 'b', 'c', 'new'])
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

  test('refuses to add past the maximum and leaves the playlist untouched', async () => {
    const ctx = createCtx()
    const full = playlist(
      'a',
      Array.from({ length: MAX_CUSTOM_PLAYLIST_SERMONS }, (_, index) => sermon(`s-${index}`)),
    )
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, full])

    const outcome = await togglePlaylistSermon(ctx, 'a', sermon('extra'), true)

    expect(outcome).toBe('limit-reached')
    const stored = ctx.get(myPlaylistsAtom).find(p => p.id === 'a')
    expect(stored?.sermonIds).toHaveLength(MAX_CUSTOM_PLAYLIST_SERMONS)
    expect(stored?.sermonIds).not.toContain('extra')
    expect(await AsyncStorage.getItem(MY_PLAYLISTS_KEY)).toBeNull()
  })

  test('still removes a sermon when the playlist is at the maximum', async () => {
    const ctx = createCtx()
    const full = playlist(
      'a',
      Array.from({ length: MAX_CUSTOM_PLAYLIST_SERMONS }, (_, index) => sermon(`s-${index}`)),
    )
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, full])

    const outcome = await togglePlaylistSermon(ctx, 'a', sermon('s-0'), false)

    expect(outcome).toBe('removed')
    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toHaveLength(
      MAX_CUSTOM_PLAYLIST_SERMONS - 1,
    )
  })

  test('reports added/removed/noop outcomes for the ordinary toggles', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])

    await expect(togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)).resolves.toBe('added')
    await expect(togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)).resolves.toBe('noop')
    await expect(togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false)).resolves.toBe('removed')
  })

  test('commits the atom even when persisting fails', async () => {
    mockConsole('error')
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

  test('closes the player when the current sermon leaves its playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-1')])])
    currentPlaylistAtom(ctx, playerPlaylist('a', 'sermon-1'))
    currentAudioAtom(ctx, toAudioPlayerData(sermon('sermon-1')))

    const outcome = await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false)

    expect(outcome).toBe('removed')
    expect(mockResetPlaybackAction).toHaveBeenCalledTimes(1)
  })

  test('updates the queue context when a non-current sermon leaves the playing playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      FAVORITES_PLAYLIST,
      playlist('a', [sermon('sermon-1'), sermon('sermon-2')]),
    ])
    currentPlaylistAtom(ctx, {
      artwork: null,
      id: 'a',
      sermons: [sermon('sermon-1'), sermon('sermon-2')],
      title: 'a',
    })
    currentAudioAtom(ctx, toAudioPlayerData(sermon('sermon-1')))

    const outcome = await togglePlaylistSermon(ctx, 'a', sermon('sermon-2'), false)

    expect(outcome).toBe('removed')
    expect(ctx.get(currentPlaylistAtom)?.sermons.map(item => item.id)).toEqual(['sermon-1'])
    expect(ctx.get(currentAudioAtom)?.id).toBe('sermon-1')
    expect(mockResetPlaybackAction).not.toHaveBeenCalled()

    const stored = JSON.parse((await AsyncStorage.getItem(CURRENT_PLAYLIST)) ?? 'null')
    expect(stored?.sermons?.map((item: SermonData) => item.id)).toEqual(['sermon-1'])
  })

  test('leaves the queue context untouched when removing from another playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-2')])])
    currentPlaylistAtom(ctx, {
      artwork: null,
      id: 'b',
      sermons: [sermon('sermon-1')],
      title: 'b',
    })

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-2'), false)

    expect(ctx.get(currentPlaylistAtom)?.id).toBe('b')
    expect(ctx.get(currentPlaylistAtom)?.sermons.map(item => item.id)).toEqual(['sermon-1'])
    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
  })

  test('suppresses the player reset when the caller orchestrates it', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-1')])])
    currentPlaylistAtom(ctx, playerPlaylist('a', 'sermon-1'))
    currentAudioAtom(ctx, toAudioPlayerData(sermon('sermon-1')))

    const outcome = await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false, {
      suppressPlayerReset: true,
    })

    expect(outcome).toBe('removed')
    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
    expect(ctx.get(myPlaylistsAtom).find(p => p.id === 'a')?.sermonIds).toEqual([])
  })

  test('keeps the player when a different sermon leaves the playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-1')])])
    currentPlaylistAtom(ctx, playerPlaylist('a', 'sermon-2'))
    currentAudioAtom(ctx, toAudioPlayerData(sermon('sermon-2')))

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false)

    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
  })

  test('keeps the player when the current sermon leaves another playlist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('sermon-1')])])
    currentPlaylistAtom(ctx, playerPlaylist('b', 'sermon-1'))
    currentAudioAtom(ctx, toAudioPlayerData(sermon('sermon-1')))

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), false)

    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
  })

  test('does not close the player when the current sermon is added', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a')])
    currentPlaylistAtom(ctx, playerPlaylist('a', 'sermon-1'))
    currentAudioAtom(ctx, toAudioPlayerData(sermon('sermon-1')))

    await togglePlaylistSermon(ctx, 'a', sermon('sermon-1'), true)

    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
  })
})
