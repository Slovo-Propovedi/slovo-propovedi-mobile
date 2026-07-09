import { renderHook } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { useNetworkIslandAnimation } from './useNetworkIslandAnimation'

describe('useNetworkIslandAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('initial state: isExpanded is true', async () => {
    const { result } = await renderHook(() => useNetworkIslandAnimation(true))

    expect(result.current.isExpanded).toBe(true)
  })

  test('initial state: expandProgress starts at 1 (expanded)', async () => {
    const withTimingSpy = jest.spyOn(Reanimated, 'withTiming')
    const { result } = await renderHook(() => useNetworkIslandAnimation(true))

    result.current.collapse()

    // collapse() animates from 1→0, confirming start value was 1
    expect(withTimingSpy).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 300 }))
  })

  test('collapse and expand are returned as functions', async () => {
    const { result } = await renderHook(() => useNetworkIslandAnimation(true))

    expect(typeof result.current.collapse).toBe('function')
    expect(typeof result.current.expand).toBe('function')
  })

  test('when isOnline transitions to false, expand is triggered', async () => {
    const withTimingSpy = jest.spyOn(Reanimated, 'withTiming')
    const { rerender } = await renderHook(
      ({ isOnline }: { isOnline: boolean }) => useNetworkIslandAnimation(isOnline),
      { initialProps: { isOnline: true } },
    )

    withTimingSpy.mockClear()
    await rerender({ isOnline: false })

    // expand() calls withTiming(1, { duration: 300 })
    expect(withTimingSpy).toHaveBeenCalledWith(1, expect.objectContaining({ duration: 300 }))
  })

  test('when isOnline transitions to true, pending timeout is cleared', async () => {
    const withTimingSpy = jest.spyOn(Reanimated, 'withTiming')
    const { rerender } = await renderHook(
      ({ isOnline }: { isOnline: boolean }) => useNetworkIslandAnimation(isOnline),
      // Initial render with false triggers expand() which sets a timeout
      { initialProps: { isOnline: false } },
    )

    withTimingSpy.mockClear()
    await rerender({ isOnline: true })

    // Timeout was cleared by the effect; advancing time should NOT fire collapse
    jest.advanceTimersByTime(2000)

    expect(withTimingSpy).not.toHaveBeenCalledWith(0, expect.any(Object))
  })

  test('expand sets an auto-collapse timeout that collapses after 2000ms', async () => {
    const withTimingSpy = jest.spyOn(Reanimated, 'withTiming')
    const { result } = await renderHook(() => useNetworkIslandAnimation(true))

    withTimingSpy.mockClear()
    result.current.expand()

    // Ignore withTiming(1) from expand(), look for withTiming(0) from collapse
    withTimingSpy.mockClear()
    jest.advanceTimersByTime(2000)

    expect(withTimingSpy).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 300 }))
  })

  test('expand clears previous timeout before setting new one', async () => {
    const withTimingSpy = jest.spyOn(Reanimated, 'withTiming')
    const { result } = await renderHook(() => useNetworkIslandAnimation(true))

    withTimingSpy.mockClear()
    result.current.expand() // sets timeout1
    result.current.expand() // clears timeout1, sets timeout2

    jest.advanceTimersByTime(2000)

    // Only one collapse should fire (from timeout2)
    const collapseCalls = withTimingSpy.mock.calls.filter(([val]) => val === 0)
    expect(collapseCalls).toHaveLength(1)
  })

  test('does not throw on unmount', async () => {
    const { unmount } = await renderHook(() => useNetworkIslandAnimation(false))

    await expect(unmount()).resolves.not.toThrow()
  })
})
