import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { mockConsole } from 'shared/mocks'
import { type SermonShape } from 'shared/model'
import { FAVORITES_PLAYLIST, type LocalPlaylistData } from './localPlaylists'
import { myPlaylistsAtom } from './model'
import { reorderLocalPlaylistSermons } from './reorderLocalPlaylistSermons'

const MY_PLAYLISTS_KEY = 'myPlaylists'

const sermon = (id: string): SermonShape => ({
  artist: 'Pastor',
  artwork: null,
  id,
  title: `Sermon ${id}`,
})

const playlist = (id: string, sermons: SermonShape[]): LocalPlaylistData => ({
  id,
  sermonIds: sermons.map(item => item.id),
  sermons,
  title: id,
})

describe('reorderLocalPlaylistSermons', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('permutes both the sermon snapshot and the derived ids', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('s1'), sermon('s2')])])

    await reorderLocalPlaylistSermons(ctx, 'a', ['s2', 's1'])

    const target = ctx.get(myPlaylistsAtom).find(item => item.id === 'a')
    expect(target?.sermons.map(item => item.id)).toEqual(['s2', 's1'])
    expect(target?.sermonIds).toEqual(['s2', 's1'])
  })

  test('persists the new order to myPlaylists storage', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('s1'), sermon('s2')])])

    await reorderLocalPlaylistSermons(ctx, 'a', ['s2', 's1'])

    const stored = JSON.parse((await AsyncStorage.getItem(MY_PLAYLISTS_KEY)) ?? '[]')
    expect(stored[1].sermonIds).toEqual(['s2', 's1'])
  })

  test('permutes ids only when the playlist has no snapshots', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      FAVORITES_PLAYLIST,
      { id: 'a', sermonIds: ['s1', 's2', 's3'], sermons: [], title: 'a' },
    ])

    await reorderLocalPlaylistSermons(ctx, 'a', ['s3', 's1', 's2'])

    const target = ctx.get(myPlaylistsAtom).find(item => item.id === 'a')
    expect(target?.sermonIds).toEqual(['s3', 's1', 's2'])
    expect(target?.sermons).toEqual([])
  })

  test('appends sermons missing from the ordered ids', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      FAVORITES_PLAYLIST,
      playlist('a', [sermon('s1'), sermon('s2'), sermon('s3')]),
    ])

    // `s3` was added concurrently and is absent from the dragged order.
    await reorderLocalPlaylistSermons(ctx, 'a', ['s2', 's1'])

    const target = ctx.get(myPlaylistsAtom).find(item => item.id === 'a')
    expect(target?.sermonIds).toEqual(['s2', 's1', 's3'])
  })

  test('never reorders favorites', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    await reorderLocalPlaylistSermons(ctx, FAVORITES_PLAYLIST.id, ['s1'])

    expect(ctx.get(myPlaylistsAtom)).toEqual([FAVORITES_PLAYLIST])
  })

  test('ignores an unknown playlist id', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('s1'), sermon('s2')])])

    await reorderLocalPlaylistSermons(ctx, 'missing', ['s2', 's1'])

    expect(ctx.get(myPlaylistsAtom).find(item => item.id === 'a')?.sermonIds).toEqual(['s1', 's2'])
  })

  test('keeps the reordered atom even when persisting fails', async () => {
    mockConsole('error')
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'))
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, playlist('a', [sermon('s1'), sermon('s2')])])

    await reorderLocalPlaylistSermons(ctx, 'a', ['s2', 's1'])

    expect(ctx.get(myPlaylistsAtom).find(item => item.id === 'a')?.sermonIds).toEqual(['s2', 's1'])
  })

  test('keeps id-only members when reordering a playlist with snapshots', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      FAVORITES_PLAYLIST,
      { id: 'a', sermonIds: ['s1', 's2', 's3'], sermons: [sermon('s1')], title: 'a' },
    ])

    await reorderLocalPlaylistSermons(ctx, 'a', ['s3', 's1'])

    const target = ctx.get(myPlaylistsAtom).find(item => item.id === 'a')
    expect(target?.sermonIds).toEqual(['s3', 's1', 's2'])
    expect(target?.sermons.map(item => item.id)).toEqual(['s1'])
  })
})
