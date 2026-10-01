import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { MY_PLAYLISTS } from './localPlaylists'
import { loadMyPlaylists, myPlaylistsAtom } from './model'

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
      JSON.stringify([
        {
          id: 'mixed',
          sermonIds: ['ghost'],
          sermons: [
            {
              artist: 'P',
              artwork: null,
              audioUrl: 'https://cdn/1.mp3',
              id: 'sermon-1',
              title: 'S',
            },
          ],
          title: 'Mixed',
        },
      ]),
    )
    const ctx = createCtx()

    await loadMyPlaylists(ctx)

    const mixed = ctx.get(myPlaylistsAtom).find(p => p.id === 'mixed')
    expect(mixed?.sermonIds).toEqual(['sermon-1'])
    expect(mixed?.sermons).toHaveLength(1)
  })
})
