import { act, renderHook } from '@testing-library/react-native'
import { useSeekControls } from './useSeekControls'

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
      result.current.startSeek('forward')
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
      result.current.startSeek('backward')
    })

    await act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(seekTo).toHaveBeenLastCalledWith(0)
    expect(result.current.isSeeking).toBe(false)
  })
})
