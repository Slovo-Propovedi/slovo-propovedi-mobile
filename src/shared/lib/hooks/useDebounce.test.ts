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
