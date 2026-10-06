import { act, renderHook } from '@testing-library/react-native'
import { useSilentRefetchOnFocus } from './useSilentRefetchOnFocus'

// useFocusEffect: capture the latest callback so tests can simulate the screen
// regaining focus (returning to a screen after a mutation elsewhere).
let mockFocusCallback: () => void = () => {}

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    mockFocusCallback = callback
    useEffect(callback, [callback])
  },
}))

describe('useSilentRefetchOnFocus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFocusCallback = () => {}
  })

  test('skips the initial focus that coincides with the mount fetch', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined)

    await renderHook(() => useSilentRefetchOnFocus(refetch))

    await act(async () => {})

    expect(refetch).not.toHaveBeenCalled()
  })

  test('refetches on every subsequent focus', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined)

    await renderHook(() => useSilentRefetchOnFocus(refetch))

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {
      mockFocusCallback()
    })

    expect(refetch).toHaveBeenCalledTimes(2)
  })

  test('a rejected refetch does not produce an unhandled rejection', async () => {
    const refetch = jest.fn().mockRejectedValueOnce(new Error('network'))

    await renderHook(() => useSilentRefetchOnFocus(refetch))

    await act(async () => {
      mockFocusCallback()
    })

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  test('uses the latest refetch callback after it changes', async () => {
    const first = jest.fn().mockResolvedValue(undefined)
    const second = jest.fn().mockResolvedValue(undefined)

    const { rerender } = await renderHook(
      ({ refetch }: { refetch: () => Promise<void> }) => useSilentRefetchOnFocus(refetch),
      { initialProps: { refetch: first } },
    )

    await act(async () => {
      await rerender({ refetch: second })
    })

    await act(async () => {
      mockFocusCallback()
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
