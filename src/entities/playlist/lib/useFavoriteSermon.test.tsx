import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { currentAudioAtom, currentPlaylistAtom } from 'entities/player/@x/playlist'
import { type SermonData, toAudioPlayerData } from 'entities/sermon'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { toastAtom } from 'shared/model'
import { PLAYLIST_SERMON_LIMIT_MESSAGE } from '../localPlaylistMembership'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  MAX_CUSTOM_PLAYLIST_SERMONS,
} from '../localPlaylists'
import { myPlaylistsAtom } from '../model'
import { useFavoriteSermon } from './useFavoriteSermon'

const mockResetPlaybackAction = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/player/@x/playlist', () => {
  const actual = jest.requireActual('entities/player/@x/playlist')
  return {
    ...actual,
    resetPlaybackAction: (...args: unknown[]) => mockResetPlaybackAction(...args),
  }
})

const SERMON: SermonData = {
  artist: 'Pastor',
  artwork: null,
  audioUrl: 'https://cdn/sermon-1.mp3',
  id: 'sermon-1',
  title: 'Слово',
}

const favoritesWith = (sermons: SermonData[]): LocalPlaylistData => ({
  ...FAVORITES_PLAYLIST,
  sermonIds: sermons.map(sermon => sermon.id),
  sermons,
})

const renderFavoriteHook = async (
  sermon: null | SermonData,
  playlists?: LocalPlaylistData[],
  setupPlayer?: (ctx: ReturnType<typeof createCtx>) => void,
) => {
  const ctx = createCtx()
  myPlaylistsAtom(ctx, playlists ?? [FAVORITES_PLAYLIST])
  setupPlayer?.(ctx)
  const utils = await renderHookWithProviders(() => useFavoriteSermon(sermon), { ctx })
  return { ...utils, ctx }
}

describe('useFavoriteSermon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('reports a sermon that is already in favorites', async () => {
    const { result } = await renderFavoriteHook(SERMON, [favoritesWith([SERMON])])

    expect(result.current.isFavorite).toBe(true)
  })

  test('reports a sermon outside favorites', async () => {
    const { result } = await renderFavoriteHook(SERMON, [FAVORITES_PLAYLIST])

    expect(result.current.isFavorite).toBe(false)
  })

  test('adds the sermon to favorites on toggle', async () => {
    const { ctx, result } = await renderFavoriteHook(SERMON)

    await act(async () => {
      result.current.toggleFavorite()
    })

    const favorites = ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'favorites')
    expect(favorites?.sermonIds).toContain(SERMON.id)
    expect(ctx.get(toastAtom)).toBeNull()
  })

  test('shows a limit toast and leaves favorites untouched at the limit', async () => {
    const fullFavorites = Array.from({ length: MAX_CUSTOM_PLAYLIST_SERMONS }, (_, index) => ({
      ...SERMON,
      id: `favorite-${index}`,
    }))
    const { ctx, result } = await renderFavoriteHook(SERMON, [favoritesWith(fullFavorites)])

    await act(async () => {
      result.current.toggleFavorite()
    })

    expect(ctx.get(toastAtom)).toBe(PLAYLIST_SERMON_LIMIT_MESSAGE)
    const favorites = ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'favorites')
    expect(favorites?.sermonIds).toHaveLength(MAX_CUSTOM_PLAYLIST_SERMONS)
    expect(favorites?.sermonIds).not.toContain(SERMON.id)
  })

  test('removes the sermon from favorites on toggle', async () => {
    const { ctx, result } = await renderFavoriteHook(SERMON, [favoritesWith([SERMON])])

    await act(async () => {
      result.current.toggleFavorite()
    })

    const favorites = ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'favorites')
    expect(favorites?.sermonIds).not.toContain(SERMON.id)
  })

  test('keeps the player alive when un-favoriting the sermon playing from favorites', async () => {
    const { ctx, result } = await renderFavoriteHook(
      SERMON,
      [favoritesWith([SERMON])],
      setupCtx => {
        currentPlaylistAtom(setupCtx, {
          artwork: null,
          id: FAVORITES_PLAYLIST.id,
          sermons: [SERMON],
          title: FAVORITES_PLAYLIST.title,
        })
        currentAudioAtom(setupCtx, toAudioPlayerData(SERMON))
      },
    )

    await act(async () => {
      result.current.toggleFavorite()
    })

    expect(mockResetPlaybackAction).not.toHaveBeenCalled()
    const favorites = ctx.get(myPlaylistsAtom).find(playlist => playlist.id === 'favorites')
    expect(favorites?.sermonIds).not.toContain(SERMON.id)
  })

  test('is inert for a null sermon', async () => {
    const { ctx, result } = await renderFavoriteHook(null)

    expect(result.current.isFavorite).toBe(false)

    await act(async () => {
      result.current.toggleFavorite()
    })

    expect(ctx.get(myPlaylistsAtom)).toEqual([FAVORITES_PLAYLIST])
  })
})
