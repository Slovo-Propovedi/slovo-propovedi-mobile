import { createCtx } from '@reatom/framework'
import { FAVORITES_PLAYLIST, type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useSortedPlaylists } from './useSortedPlaylists'

const SERMON: SermonData = {
  artist: 'Pastor',
  artwork: null,
  audioUrl: 'https://cdn/sermon-1.mp3',
  id: 'sermon-1',
  title: 'Слово',
}

const playlist = (id: string, sermons: SermonData[] = []): LocalPlaylistData => ({
  id,
  sermonIds: sermons.map(sermon => sermon.id),
  sermons,
  title: id,
})

describe('useSortedPlaylists', () => {
  test('keeps atom order within the contained group, favorites first', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      { ...FAVORITES_PLAYLIST, sermonIds: [SERMON.id], sermons: [SERMON] },
      playlist('a', [SERMON]),
      playlist('b'),
      playlist('c', [SERMON]),
    ])

    const { result } = await renderHookWithProviders(() => useSortedPlaylists(SERMON.id), { ctx })

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
