import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { type SermonData } from 'entities/sermon'
import { togglePlaylistSermon } from './localPlaylistMembership'
import { FAVORITES_PLAYLIST, MY_PLAYLISTS } from './localPlaylists'
import { loadMyPlaylists, myPlaylistsAtom } from './model'

const SERMON: SermonData = {
  artist: 'P',
  artwork: null,
  audioUrl: 'https://cdn/sermon-1.mp3',
  id: 'sermon-1',
  title: 'S',
}

// Legacy rows stored before the snapshot migration carried only `sermonIds`.
const legacyLegacyRow = {
  id: 'legacy',
  sermonIds: ['sermon-1', 'sermon-2'],
  title: 'Legacy',
}

describe('loadMyPlaylists legacy data', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('loads a legacy sermonIds-only playlist without crashing and empty sermons', async () => {
    await AsyncStorage.setItem(
      MY_PLAYLISTS,
      JSON.stringify([
        { id: 'favorites', sermonIds: ['sermon-1'], title: 'Избранные' },
        legacyLegacyRow,
      ]),
    )
    const ctx = createCtx()

    await loadMyPlaylists(ctx)

    const legacy = ctx.get(myPlaylistsAtom).find(p => p.id === 'legacy')
    expect(legacy?.sermons).toEqual([])
    expect(legacy?.sermonIds).toEqual([])
  })

  test('drops legacy ids silently when snapshot sermons exist', async () => {
    await AsyncStorage.setItem(
      MY_PLAYLISTS,
      JSON.stringify([{ id: 'mixed', sermonIds: ['ghost'], sermons: [SERMON], title: 'Mixed' }]),
    )
    const ctx = createCtx()

    await loadMyPlaylists(ctx)

    const mixed = ctx.get(myPlaylistsAtom).find(p => p.id === 'mixed')
    expect(mixed?.sermonIds).toEqual(['sermon-1'])
    expect(mixed?.sermons).toHaveLength(1)
  })
})

describe('loadMyPlaylists favorites preservation', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('keeps stored favorites sermons and pins favorites first', async () => {
    await AsyncStorage.setItem(
      MY_PLAYLISTS,
      JSON.stringify([
        { id: 'plain', sermonIds: [], sermons: [], title: 'Plain' },
        { id: 'favorites', sermonIds: [SERMON.id], sermons: [SERMON], title: 'Избранные' },
      ]),
    )
    const ctx = createCtx()

    await loadMyPlaylists(ctx)

    const playlists = ctx.get(myPlaylistsAtom)
    expect(playlists[0].id).toBe(FAVORITES_PLAYLIST.id)
    expect(playlists[0].sermons).toEqual([SERMON])
    expect(playlists[0].sermonIds).toEqual([SERMON.id])
  })

  test('seeds an empty favorites playlist when storage has none', async () => {
    await AsyncStorage.setItem(
      MY_PLAYLISTS,
      JSON.stringify([{ id: 'plain', sermonIds: [], sermons: [], title: 'Plain' }]),
    )
    const ctx = createCtx()

    await loadMyPlaylists(ctx)

    expect(ctx.get(myPlaylistsAtom)[0]).toEqual(FAVORITES_PLAYLIST)
  })

  test('keeps favorites sermons after a reload round-trip', async () => {
    const firstCtx = createCtx()
    await togglePlaylistSermon(firstCtx, FAVORITES_PLAYLIST.id, SERMON, true)

    const reloadedCtx = createCtx()
    await loadMyPlaylists(reloadedCtx)

    expect(reloadedCtx.get(myPlaylistsAtom)[0].sermons).toEqual([SERMON])
  })
})
