import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { OFFLINE_SERMONS_REGISTRY } from 'shared/config'
import { type PlaylistData, type SermonData } from 'shared/model'
import type { Ctx } from '@reatom/framework'
import {
  clearOfflineRegistry,
  hydrateOfflineRegistry,
  offlineRegistryAtom,
  registerOfflineSermon,
  removeOfflineSermon,
} from './offlineSermonsRegistry'

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_AUDIO_URL = 'https://example.com/other.mp3'

const mockSermon: SermonData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Sermon 1',
}

const mockPlaylist: PlaylistData = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [mockSermon],
  title: 'Playlist 1',
}

describe('offlineSermonsRegistry', () => {
  let ctx: Ctx

  beforeEach(async () => {
    ctx = createCtx()
    await AsyncStorage.clear()
  })

  test('starts empty', () => {
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })

  test('registerOfflineSermon adds an entry keyed by URL', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)

    const registry = ctx.get(offlineRegistryAtom)
    expect(Object.keys(registry)).toEqual([AUDIO_URL])
    expect(registry[AUDIO_URL].sermon).toEqual(mockSermon)
    expect(registry[AUDIO_URL].playlist).toEqual(mockPlaylist)
  })

  test('registerOfflineSermon persists the registry to AsyncStorage', async () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    await new Promise(resolve => setTimeout(resolve, 0))

    const raw = await AsyncStorage.getItem(OFFLINE_SERMONS_REGISTRY)
    expect(raw).toBeTruthy()
    if (!raw) return
    expect(JSON.parse(raw)).toEqual({
      [AUDIO_URL]: {
        playlist: mockPlaylist,
        registeredAt: expect.any(Number),
        sermon: mockSermon,
      },
    })
  })

  test('registerOfflineSermon with identical data is a no-op (atom reference unchanged)', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    const before = ctx.get(offlineRegistryAtom)
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    expect(ctx.get(offlineRegistryAtom)).toBe(before)
  })

  test('registerOfflineSermon updates the entry when the playlist changes', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    const otherPlaylist: PlaylistData = { ...mockPlaylist, id: 'playlist-2', title: 'Playlist 2' }
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, otherPlaylist)
    expect(ctx.get(offlineRegistryAtom)[AUDIO_URL].playlist).toEqual(otherPlaylist)
  })

  test('registerOfflineSermon accepts a null playlist', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, null)
    expect(ctx.get(offlineRegistryAtom)[AUDIO_URL].playlist).toBeNull()
  })

  test('removeOfflineSermon removes the entry for the URL', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    removeOfflineSermon(ctx, AUDIO_URL)
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })

  test('removeOfflineSermon keeps other entries untouched', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    registerOfflineSermon(ctx, OTHER_AUDIO_URL, mockSermon, mockPlaylist)
    removeOfflineSermon(ctx, AUDIO_URL)
    expect(Object.keys(ctx.get(offlineRegistryAtom))).toEqual([OTHER_AUDIO_URL])
  })

  test('removeOfflineSermon is a no-op when the URL is absent (atom reference unchanged)', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    const before = ctx.get(offlineRegistryAtom)
    removeOfflineSermon(ctx, OTHER_AUDIO_URL)
    expect(ctx.get(offlineRegistryAtom)).toBe(before)
  })

  test('clearOfflineRegistry wipes all entries', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    registerOfflineSermon(ctx, OTHER_AUDIO_URL, mockSermon, mockPlaylist)
    clearOfflineRegistry(ctx)
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })

  test('clearOfflineRegistry is a no-op when already empty (atom reference unchanged)', () => {
    const before = ctx.get(offlineRegistryAtom)
    clearOfflineRegistry(ctx)
    expect(ctx.get(offlineRegistryAtom)).toBe(before)
  })

  test('hydrateOfflineRegistry loads a persisted registry', async () => {
    await AsyncStorage.setItem(
      OFFLINE_SERMONS_REGISTRY,
      JSON.stringify({
        [AUDIO_URL]: {
          playlist: mockPlaylist,
          registeredAt: 123,
          sermon: mockSermon,
        },
      }),
    )

    await hydrateOfflineRegistry(ctx)

    expect(ctx.get(offlineRegistryAtom)).toEqual({
      [AUDIO_URL]: {
        playlist: mockPlaylist,
        registeredAt: 123,
        sermon: mockSermon,
      },
    })
  })

  test('hydrateOfflineRegistry keeps the atom empty when storage is absent', async () => {
    await hydrateOfflineRegistry(ctx)
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })

  test('hydrateOfflineRegistry keeps the atom empty when storage is invalid', async () => {
    await AsyncStorage.setItem(OFFLINE_SERMONS_REGISTRY, 'not json')
    await hydrateOfflineRegistry(ctx)
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })
})
