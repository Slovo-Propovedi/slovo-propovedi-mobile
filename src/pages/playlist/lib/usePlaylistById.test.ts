import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { dynamicSectionsAtom } from 'entities/section'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { type PlaylistData, type SectionData } from 'shared/model'
import { usePlaylistById } from './usePlaylistById'

const mockResolvePlaylistFromCache = jest.fn()
const mockResolvePlaylistFromApi = jest.fn()

jest.mock('shared/ui/theme/ThemeContext/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}))

jest.mock('entities/section', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom') }
})

jest.mock('./resolvePlaylistFromCache', () => ({
  resolvePlaylistFromCache: (...args: unknown[]) => mockResolvePlaylistFromCache(...args),
}))

jest.mock('./resolvePlaylistFromApi', () => ({
  resolvePlaylistFromApi: (...args: unknown[]) => mockResolvePlaylistFromApi(...args),
}))

const PLAYLIST_1: PlaylistData = {
  artwork: null,
  description: '',
  id: 'pl-1',
  sermons: [],
  title: 'Плейлист 1',
}

const PLAYLIST_2: PlaylistData = {
  artwork: null,
  description: '',
  id: 'pl-2',
  sermons: [],
  title: 'Плейлист 2',
}

const makeSection = (playlists: PlaylistData[]): SectionData => ({
  id: 'section-1',
  itemsSize: 'small',
  playlists,
  title: 'Раздел',
  transform: 'short',
})

describe('usePlaylistById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls cache first and network only after a cache miss', async () => {
    mockResolvePlaylistFromCache.mockResolvedValue(undefined)
    mockResolvePlaylistFromApi.mockResolvedValue(PLAYLIST_1)

    await renderHookWithProviders(() => usePlaylistById('pl-1'))
    await act(async () => {})

    expect(mockResolvePlaylistFromCache).toHaveBeenCalledTimes(1)
    expect(mockResolvePlaylistFromApi).toHaveBeenCalledTimes(1)
    expect(mockResolvePlaylistFromCache.mock.invocationCallOrder[0]).toBeLessThan(
      mockResolvePlaylistFromApi.mock.invocationCallOrder[0],
    )
  })

  test('returns the playlist resolved from the network tier', async () => {
    mockResolvePlaylistFromCache.mockResolvedValue(undefined)
    mockResolvePlaylistFromApi.mockResolvedValue(PLAYLIST_1)

    const { result } = await renderHookWithProviders(() => usePlaylistById('pl-1'))
    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.notFound).toBe(false)
    expect(result.current.playlist).toBe(PLAYLIST_1)
  })

  test('shows notFound after the network tier fails instead of loading forever', async () => {
    mockResolvePlaylistFromCache.mockResolvedValue(undefined)
    mockResolvePlaylistFromApi.mockResolvedValue(undefined)

    const { result } = await renderHookWithProviders(() => usePlaylistById('pl-1'))
    await act(async () => {})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.notFound).toBe(true)
    expect(result.current.playlist).toBeUndefined()
  })

  test('does not call cache or network when the sections atom has the playlist', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection([PLAYLIST_1])])

    const { result } = await renderHookWithProviders(() => usePlaylistById('pl-1'), { ctx })

    expect(result.current.playlist).toBe(PLAYLIST_1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.notFound).toBe(false)
    expect(mockResolvePlaylistFromCache).not.toHaveBeenCalled()
    expect(mockResolvePlaylistFromApi).not.toHaveBeenCalled()
  })

  test('resolves straight from cache when the sections atom misses', async () => {
    mockResolvePlaylistFromCache.mockResolvedValue(PLAYLIST_1)

    const { result } = await renderHookWithProviders(() => usePlaylistById('pl-1'))
    await act(async () => {})

    expect(result.current.playlist).toBe(PLAYLIST_1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.notFound).toBe(false)
    expect(mockResolvePlaylistFromApi).not.toHaveBeenCalled()
  })

  test('resets the resolved state when the playlist id changes', async () => {
    let resolveSecondId!: (playlist?: PlaylistData) => void
    mockResolvePlaylistFromCache.mockResolvedValueOnce(PLAYLIST_1).mockReturnValueOnce(
      new Promise<PlaylistData | undefined>(resolve => {
        resolveSecondId = resolve
      }),
    )

    const { rerender, result } = await renderHookWithProviders(
      ({ id }: { id: string }) => usePlaylistById(id),
      { initialProps: { id: 'pl-1' } },
    )
    await act(async () => {})
    expect(result.current.playlist).toBe(PLAYLIST_1)

    await act(async () => {
      rerender({ id: 'pl-2' })
    })

    expect(result.current.playlist).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.notFound).toBe(false)

    await act(async () => {
      resolveSecondId(PLAYLIST_2)
    })

    expect(result.current.playlist).toBe(PLAYLIST_2)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.notFound).toBe(false)
  })

  test('surfaces a late sections hit over an already resolved lower tier', async () => {
    const ctx = createCtx()
    mockResolvePlaylistFromCache.mockResolvedValue(PLAYLIST_1)

    const { result } = await renderHookWithProviders(() => usePlaylistById('pl-1'), { ctx })
    await act(async () => {})
    expect(result.current.playlist).toBe(PLAYLIST_1)

    await act(async () => {
      dynamicSectionsAtom(ctx, [makeSection([PLAYLIST_1])])
    })

    expect(result.current.playlist).toBe(PLAYLIST_1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.notFound).toBe(false)
  })
})
