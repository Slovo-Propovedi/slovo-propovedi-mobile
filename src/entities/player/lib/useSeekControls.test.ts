import { act, renderHook } from '@testing-library/react-native'
import { useSeekControls } from './useSeekControls'

const FORWARD = 'forward'
const BACKWARD = 'backward'

describe('useSeekControls', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('interval ticks compute from the fresh base (no bounce)', async () => {
    const seekTo = jest.fn()
    const { result } = await renderHook(() =>
      useSeekControls({ duration: 100000, position: 10000, seekTo }),
    )

    await act(() => {
      result.current.startSeek(FORWARD)
    })

    await act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(seekTo).toHaveBeenLastCalledWith(15000)

    await act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(seekTo).toHaveBeenLastCalledWith(20000)

    await act(() => {
      result.current.stopSeek()
    })
  })

  test('backward seek clamps at zero and stops', async () => {
    const seekTo = jest.fn()
    const { result } = await renderHook(() =>
      useSeekControls({ duration: 100000, position: 3000, seekTo }),
    )

    await act(() => {
      result.current.startSeek(BACKWARD)
    })

    await act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(seekTo).toHaveBeenLastCalledWith(0)
    expect(result.current.isSeeking).toBe(false)
  })

  test('tapSeek forward jumps by 10 seconds', async () => {
    const seekTo = jest.fn()
    const { result } = await renderHook(() =>
      useSeekControls({ duration: 100000, position: 10000, seekTo }),
    )

    await act(() => {
      result.current.tapSeek(FORWARD)
    })
    expect(seekTo).toHaveBeenCalledWith(20000)
  })

  test('tapSeek backward jumps by 10 seconds and clamps at zero', async () => {
    const seekTo = jest.fn()
    const { result } = await renderHook(() =>
      useSeekControls({ duration: 100000, position: 3000, seekTo }),
    )

    await act(() => {
      result.current.tapSeek(BACKWARD)
    })
    expect(seekTo).toHaveBeenCalledWith(0)
  })

  test('tapSeek forward clamps at the end of the track', async () => {
    const seekTo = jest.fn()
    const { result } = await renderHook(() =>
      useSeekControls({ duration: 100000, position: 95000, seekTo }),
    )

    await act(() => {
      result.current.tapSeek(FORWARD)
    })
    expect(seekTo).toHaveBeenCalledWith(99900)
  })

  test('tapSeek is a no-op when duration is unknown', async () => {
    const seekTo = jest.fn()
    const { result } = await renderHook(() =>
      useSeekControls({ duration: 0, position: 10000, seekTo }),
    )

    await act(() => {
      result.current.tapSeek(FORWARD)
    })
    expect(seekTo).not.toHaveBeenCalled()
  })
})
