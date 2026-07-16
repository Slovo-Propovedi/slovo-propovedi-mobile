import { act, renderHook } from '@testing-library/react-native'
import { audioCacheService } from './AudioCacheService'
import { useIsCached } from './useIsCached'

const AUDIO_URL = 'http://example.com/sermon.mp3'

describe('useIsCached', () => {
  let isCachedSpy: jest.SpyInstance

  beforeEach(() => {
    isCachedSpy = jest.spyOn(audioCacheService, 'isCached')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns false for null audioUrl', async () => {
    const { result } = await renderHook(() => useIsCached(null))
    expect(result.current).toBe(false)
  })

  test('returns false for empty string audioUrl', async () => {
    const { result } = await renderHook(() => useIsCached(''))
    expect(result.current).toBe(false)
  })

  test('calls audioCacheService.isCached with the audioUrl', async () => {
    ;(isCachedSpy as jest.MockedFunction<typeof audioCacheService.isCached>).mockResolvedValue(
      false,
    )
    await renderHook(() => useIsCached(AUDIO_URL))
    expect(isCachedSpy).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('returns true after async check resolves to true', async () => {
    ;(isCachedSpy as jest.MockedFunction<typeof audioCacheService.isCached>).mockResolvedValue(true)
    const { result } = await renderHook(() => useIsCached(AUDIO_URL))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current).toBe(true)
  })

  test('returns false after async check resolves to false', async () => {
    ;(isCachedSpy as jest.MockedFunction<typeof audioCacheService.isCached>).mockResolvedValue(
      false,
    )
    const { result } = await renderHook(() => useIsCached(AUDIO_URL))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current).toBe(false)
  })

  test('re-checks cache when cacheTrigger changes', async () => {
    const mockIsCached = isCachedSpy as jest.MockedFunction<typeof audioCacheService.isCached>
    mockIsCached.mockResolvedValue(true)

    const { rerender, result } = await renderHook(
      ({ trigger, url }: { trigger: number; url: string }) => useIsCached(url, trigger),
      {
        initialProps: { trigger: 1, url: AUDIO_URL },
      },
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current).toBe(true)
    expect(isCachedSpy).toHaveBeenCalledTimes(1)

    mockIsCached.mockResolvedValue(false)

    await act(async () => {
      rerender({ trigger: 2, url: AUDIO_URL })
      await Promise.resolve()
    })

    expect(result.current).toBe(false)
    expect(isCachedSpy).toHaveBeenCalledTimes(2)
  })

  test('cancels pending state update on unmount', async () => {
    let resolveCheck!: (value: boolean) => void
    ;(isCachedSpy as jest.MockedFunction<typeof audioCacheService.isCached>).mockImplementation(
      () =>
        new Promise<boolean>(resolve => {
          resolveCheck = resolve
        }),
    )

    const { unmount } = await renderHook(() => useIsCached(AUDIO_URL))

    unmount()

    await act(async () => {
      resolveCheck(true)
      await Promise.resolve()
    })

    expect(isCachedSpy).toHaveBeenCalledWith(AUDIO_URL)
  })
})
