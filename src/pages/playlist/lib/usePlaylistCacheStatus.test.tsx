import { act } from '@testing-library/react-native'
import { audioCacheService } from 'shared/lib/audio-cache'
import { markUrlCached } from 'shared/lib/cache-triggers'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { usePlaylistCacheStatus } from './usePlaylistCacheStatus'

jest.mock('shared/lib/audio-cache', () => {
  const actual = jest.requireActual('shared/lib/audio-cache')
  return {
    ...actual,
    audioCacheService: {
      ...actual.audioCacheService,
      isCached: jest.fn().mockResolvedValue(false),
    },
  }
})

const mockedIsCached = jest.mocked(audioCacheService.isCached)

const TRACKS = [
  { audioUrl: 'http://example.com/1.mp3', id: '1', title: 'Первая' },
  { audioUrl: 'http://example.com/2.mp3', id: '2', title: 'Вторая' },
]

const waitForDebounce = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
  })
}

describe('usePlaylistCacheStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsCached.mockResolvedValue(false)
  })

  test('checks immediately on first mount', async () => {
    const { result } = await renderHookWithProviders(() => usePlaylistCacheStatus(TRACKS))

    expect(mockedIsCached).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ allCached: false, cachedCount: 0, totalCount: 2 })
  })

  test('debounces trigger-driven re-checks', async () => {
    const { rerender } = await renderHookWithProviders(
      ({ trigger }: { trigger?: number }) => usePlaylistCacheStatus(TRACKS, trigger),
      { initialProps: { trigger: 0 } },
    )
    expect(mockedIsCached).toHaveBeenCalledTimes(2)

    await act(async () => {
      rerender({ trigger: 1 })
    })
    // Debounced: no immediate re-check on a trigger change.
    expect(mockedIsCached).toHaveBeenCalledTimes(2)

    await waitForDebounce()
    expect(mockedIsCached).toHaveBeenCalledTimes(4)
  })

  test('reflects the cached state after the debounced check', async () => {
    mockedIsCached.mockImplementation(async url => url === TRACKS[0].audioUrl)
    const { rerender, result } = await renderHookWithProviders(
      ({ trigger }: { trigger?: number }) => usePlaylistCacheStatus(TRACKS, trigger),
      { initialProps: { trigger: 0 } },
    )
    await act(async () => {})
    expect(result.current).toEqual({ allCached: false, cachedCount: 1, totalCount: 2 })

    mockedIsCached.mockResolvedValue(true)
    await act(async () => {
      rerender({ trigger: 1 })
    })
    await waitForDebounce()
    expect(result.current).toEqual({ allCached: true, cachedCount: 2, totalCount: 2 })
  })

  test('re-checks immediately when the track set changes', async () => {
    const otherTracks = [
      ...TRACKS,
      { audioUrl: 'http://example.com/3.mp3', id: '3', title: 'Третья' },
    ]
    const { rerender } = await renderHookWithProviders(
      ({ tracks }: { tracks: typeof TRACKS }) => usePlaylistCacheStatus(tracks),
      { initialProps: { tracks: TRACKS } },
    )
    expect(mockedIsCached).toHaveBeenCalledTimes(2)

    await act(async () => {
      rerender({ tracks: otherTracks })
    })
    expect(mockedIsCached).toHaveBeenCalledTimes(5)
  })

  test('returns zeros and skips checks for empty tracks', async () => {
    const { result } = await renderHookWithProviders(() => usePlaylistCacheStatus([]))

    expect(mockedIsCached).not.toHaveBeenCalled()
    expect(result.current).toEqual({ allCached: false, cachedCount: 0, totalCount: 0 })
  })

  test('counts grow reactively from the overlay without a trigger increment', async () => {
    const { ctx, result } = await renderHookWithProviders(() => usePlaylistCacheStatus(TRACKS))
    expect(result.current).toEqual({ allCached: false, cachedCount: 0, totalCount: 2 })

    await act(async () => {
      markUrlCached(ctx, TRACKS[0].audioUrl)
    })
    expect(result.current).toEqual({ allCached: false, cachedCount: 1, totalCount: 2 })

    await act(async () => {
      markUrlCached(ctx, TRACKS[1].audioUrl)
    })
    expect(result.current).toEqual({ allCached: true, cachedCount: 2, totalCount: 2 })

    // The overlay path must not trigger a debounced FS rescan.
    expect(mockedIsCached).toHaveBeenCalledTimes(2)
  })
})
