import { act, renderHook } from '@testing-library/react-native'
import { useTimer } from './useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns initial countdown value on mount', async () => {
    const { result } = await renderHook(() => useTimer(10))
    expect(result.current.countdownValue).toBe(10)
  })

  test('counts down by 1 each interval tick', async () => {
    const { result } = await renderHook(() => useTimer(5))

    await act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.countdownValue).toBe(4)
  })

  test('counts down to 0 and stops without going negative', async () => {
    const { result } = await renderHook(() => useTimer(2))

    await act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(result.current.countdownValue).toBe(0)

    await act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.countdownValue).toBe(0)
  })

  test('pauseTimer stops the countdown', async () => {
    const { result } = await renderHook(() => useTimer(5))

    await act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.countdownValue).toBe(4)

    await act(() => {
      result.current.pauseTimer()
    })

    await act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(result.current.countdownValue).toBe(4)
  })

  test('resumeTimer continues the countdown after pause', async () => {
    const { result } = await renderHook(() => useTimer(5))

    await act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.countdownValue).toBe(4)

    await act(() => {
      result.current.pauseTimer()
    })

    await act(() => {
      result.current.resumeTimer()
    })

    await act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.countdownValue).toBe(3)
  })

  test('restartTimer resets countdownValue to startValue', async () => {
    const { result } = await renderHook(() => useTimer(5))

    await act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(result.current.countdownValue).toBe(2)

    await act(() => {
      result.current.restartTimer()
    })

    expect(result.current.countdownValue).toBe(5)
  })

  test('setCountdownValue sets an arbitrary value', async () => {
    const { result } = await renderHook(() => useTimer(10))

    await act(() => {
      result.current.setCountdownValue(42)
    })

    expect(result.current.countdownValue).toBe(42)
  })

  test('uses custom timeout interval', async () => {
    const { result } = await renderHook(() => useTimer(10, 500))

    await act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current.countdownValue).toBe(9)
  })

  test('cleans up interval on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const { unmount } = await renderHook(() => useTimer(10))

    await unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
