import { createCtx } from '@reatom/framework'
import { FAVORITES_PLAYLIST, type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useSortedPlaylists } from './useSortedPlaylists'

const SERMON_ID = 'sermon-1'

const playlist = (id: string, sermonIds: string[] = []): LocalPlaylistData => ({
  id,
  sermonIds,
  title: id,
})

describe('useSortedPlaylists', () => {
  test('keeps atom order within the contained group, favorites first', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      { ...FAVORITES_PLAYLIST, sermonIds: [SERMON_ID] },
      playlist('a', [SERMON_ID]),
      playlist('b'),
      playlist('c', [SERMON_ID]),
    ])

    const { result } = await renderHookWithProviders(() => useSortedPlaylists(SERMON_ID), { ctx })

    expect(result.current.map(membership => membership.playlist.id)).toEqual([
      'favorites',
      'a',
      'c',
      'b',
    ])
    expect(result.current.map(membership => membership.isContained)).toEqual([
      true,
      true,
      true,
      false,
    ])
  })
})
