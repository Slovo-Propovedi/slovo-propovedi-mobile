import { act, renderHook } from '@testing-library/react-native'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns a function', async () => {
    const { result } = await renderHook(() => useDebounce(() => {}, 500))
    expect(typeof result.current).toBe('function')
  })

  test('does not invoke the action before the delay elapses', async () => {
    const action = jest.fn()
    const { result } = await renderHook(() => useDebounce(action, 500))

    await act(async () => {
      result.current('hello')
    })

    expect(action).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(499)
    })

    expect(action).not.toHaveBeenCalled()
  })

  test('invokes the action after the delay elapses', async () => {
    const action = jest.fn()
    const { result } = await renderHook(() => useDebounce(action, 500))

    await act(async () => {
      result.current('hello')
      jest.advanceTimersByTime(500)
    })

    expect(action).toHaveBeenCalledWith('hello')
    expect(action).toHaveBeenCalledTimes(1)
  })

  test('only invokes once for rapid successive calls', async () => {
    const action = jest.fn()
    const { result } = await renderHook(() => useDebounce(action, 500))

    await act(async () => {
      result.current('first')
      result.current('second')
      result.current('third')
      jest.advanceTimersByTime(500)
    })

    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledWith('third')
  })

  test('resets timer on each call during rapid succession', async () => {
    const action = jest.fn()
    const { result } = await renderHook(() => useDebounce(action, 500))

    await act(async () => {
      result.current('first')
      jest.advanceTimersByTime(300)
    })

    await act(async () => {
      result.current('second')
      jest.advanceTimersByTime(300)
    })

    // Timer was reset — should not have fired yet
    expect(action).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(200)
    })

    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledWith('second')
  })

  test('debounced function exposes a clear method', async () => {
    const { result } = await renderHook(() => useDebounce(() => {}, 500))
    expect(typeof result.current.clear).toBe('function')
  })

  test('clear prevents pending invocation', async () => {
    const action = jest.fn()
    const { result } = await renderHook(() => useDebounce(action, 500))

    await act(async () => {
      result.current('hello')
      result.current.clear()
      jest.advanceTimersByTime(500)
    })

    expect(action).not.toHaveBeenCalled()
  })

  test('unmounting cancels the pending invocation', async () => {
    const action = jest.fn()
    const { result, unmount } = await renderHook(() => useDebounce(action, 500))

    await act(async () => {
      result.current('hello')
    })

    await unmount()

    // No component left to consume the result — the timer must not survive.
    jest.advanceTimersByTime(500)

    expect(action).not.toHaveBeenCalled()
  })

  test('flushOnUnmount runs the pending invocation on unmount instead of dropping it', async () => {
    const action = jest.fn()
    const { result, unmount } = await renderHook(() =>
      useDebounce(action, 500, [], { flushOnUnmount: true }),
    )

    await act(async () => {
      result.current('hello')
    })

    await unmount()

    expect(action).toHaveBeenCalledWith('hello')
    expect(action).toHaveBeenCalledTimes(1)
  })

  test('flushOnUnmount stays quiet when nothing is pending', async () => {
    const action = jest.fn()
    const { unmount } = await renderHook(() =>
      useDebounce(action, 500, [], { flushOnUnmount: true }),
    )

    await unmount()

    expect(action).not.toHaveBeenCalled()
  })

  test('keeps the same debounced action while the deps hold', async () => {
    const action = jest.fn()
    const { rerender, result } = await renderHook(
      ({ value }: { value: number }) => useDebounce(() => action(value), 500, [value]),
      { initialProps: { value: 1 } },
    )

    await act(async () => {
      result.current()
    })

    const initial = result.current
    await rerender({ value: 1 })

    expect(result.current).toBe(initial)

    // Unchanged deps — the pending call of the first render survives.
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(action).toHaveBeenCalledWith(1)
  })

  test('rebuilds the debounced action and drops the pending call on a deps change', async () => {
    const first = jest.fn()
    const second = jest.fn()
    const { rerender, result } = await renderHook(
      ({ action, value }: { action: (value: number) => void; value: number }) =>
        useDebounce(() => action(value), 500, [action, value]),
      { initialProps: { action: first, value: 1 } },
    )

    await act(async () => {
      result.current()
    })

    const beforeSwap = result.current
    await rerender({ action: second, value: 2 })

    expect(result.current).not.toBe(beforeSwap)

    // The stale closure is gone with the old action: only the fresh one runs.
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(first).not.toHaveBeenCalled()

    await act(async () => {
      result.current()
      jest.advanceTimersByTime(500)
    })

    expect(second).toHaveBeenCalledWith(2)
  })

  test('works with numeric arguments', async () => {
    const action = jest.fn()
    const { result } = await renderHook(() => useDebounce(action, 300))

    await act(async () => {
      result.current(42)
      jest.advanceTimersByTime(300)
    })

    expect(action).toHaveBeenCalledWith(42)
  })

  test('works with object arguments', async () => {
    const action = jest.fn()
    const payload = { id: 1, name: 'test' }
    const { result } = await renderHook(() => useDebounce(action, 300))

    await act(async () => {
      result.current(payload)
      jest.advanceTimersByTime(300)
    })

    expect(action).toHaveBeenCalledWith(payload)
  })
})
