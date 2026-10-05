import { act } from '@testing-library/react-native'
import { playlistsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { PLAYLISTS_PAGE_SIZE } from './fetchPlaylistsPage'
import { useAdminPlaylists } from './useAdminPlaylists'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  playlistsApi: { getPlaylists: () => ({ playlistControllerFindAll: mockFindAll }) },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

// useFocusEffect: capture the latest callback so tests can simulate a re-focus
// (returning to the list screen after editing a playlist).
let mockFocusCallback: () => void = () => {}
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    mockFocusCallback = callback
    useEffect(callback, [callback])
  },
}))

const buildResponse = (artwork: string) =>
  playlistsMocks.getPlaylistControllerFindAllResponseMock({
    playlists: [
      { artwork, description: 'Описание', id: 'p1', sections: [], sermons: [], title: 'Первый' },
    ],
  })

const buildFullPage = () =>
  playlistsMocks.getPlaylistControllerFindAllResponseMock({
    playlists: Array.from({ length: PLAYLISTS_PAGE_SIZE }, (_, index) => ({
      artwork: '',
      description: 'Описание',
      id: `p${index}`,
      sections: [],
      sermons: [],
      title: `Плейлист ${index}`,
    })),
  })

describe('useAdminPlaylists', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('refetches the first page when the screen regains focus so a cleared cover disappears', async () => {
    mockFindAll
      .mockResolvedValueOnce(buildResponse('cover-old'))
      .mockResolvedValueOnce(buildResponse(''))

    const { result } = await renderHookWithProviders(() => useAdminPlaylists())

    await act(async () => {})

    expect(result.current.playlists[0]?.artwork).toBe('cover-old')

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.playlists[0]?.artwork).toBe('')
    expect(mockFindAll).toHaveBeenCalledTimes(2)
  })

  test('refreshes silently, keeping the current list visible while the refetch is in flight', async () => {
    mockFindAll.mockResolvedValueOnce(buildResponse('cover-old'))

    const { result } = await renderHookWithProviders(() => useAdminPlaylists())

    await act(async () => {})

    expect(result.current.isLoading).toBe(false)

    let resolveRefresh: (response: unknown) => void = () => {}
    mockFindAll.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRefresh = resolve
      }),
    )

    await act(async () => {
      mockFocusCallback()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.playlists[0]?.artwork).toBe('cover-old')

    await act(async () => {
      resolveRefresh(buildResponse(''))
    })

    expect(result.current.playlists[0]?.artwork).toBe('')
  })

  test('clears a failed loadMore flag when the list reloads on focus', async () => {
    mockFindAll
      .mockResolvedValueOnce(buildFullPage())
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(buildFullPage())

    const { result } = await renderHookWithProviders(() => useAdminPlaylists())

    await act(async () => {})

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.loadMoreFailed).toBe(true)

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.loadMoreFailed).toBe(false)
  })

  test('ignores loadMore while a silent focus refresh is in flight', async () => {
    mockFindAll.mockResolvedValueOnce(buildFullPage())

    const { result } = await renderHookWithProviders(() => useAdminPlaylists())

    await act(async () => {})

    const initialIds = result.current.playlists.map(playlist => playlist.id)

    let resolveRefresh: (response: unknown) => void = () => {}
    mockFindAll.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRefresh = resolve
      }),
    )

    await act(async () => {
      mockFocusCallback()
    })

    await act(async () => {
      await result.current.loadMore()
    })

    expect(mockFindAll).toHaveBeenCalledTimes(2)
    expect(result.current.playlists.map(playlist => playlist.id)).toEqual(initialIds)

    await act(async () => {
      resolveRefresh(buildFullPage())
    })
  })
})
