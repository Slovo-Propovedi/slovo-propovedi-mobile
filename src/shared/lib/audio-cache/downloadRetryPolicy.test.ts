import { sleepAbortable } from './downloadRetryPolicy'

describe('sleepAbortable', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('resolves only after the full delay when no signal is given', async () => {
    const sleep = sleepAbortable(1000)
    let resolved = false
    void sleep.then(() => {
      resolved = true
    })

    await jest.advanceTimersByTimeAsync(999)
    expect(resolved).toBe(false)

    await jest.advanceTimersByTimeAsync(1)
    await expect(sleep).resolves.toBeUndefined()
    expect(resolved).toBe(true)
  })

  test('resolves early on abort mid-sleep and leaves no timer behind', async () => {
    const controller = new AbortController()
    const sleep = sleepAbortable(5000, controller.signal)
    let resolveCount = 0
    void sleep.then(() => {
      resolveCount++
    })

    await jest.advanceTimersByTimeAsync(1000)
    expect(resolveCount).toBe(0)

    controller.abort()
    await expect(sleep).resolves.toBeUndefined()
    expect(resolveCount).toBe(1)

    // The abort path cleared the timer and detached the once-listener: letting
    // the full delay elapse afterwards resolves nothing a second time.
    await jest.advanceTimersByTimeAsync(5000)
    expect(resolveCount).toBe(1)
  })

  test('resolves immediately when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const sleep = sleepAbortable(10_000, controller.signal)

    // The already-aborted branch arms no timer at all.
    expect(jest.getTimerCount()).toBe(0)
    await expect(sleep).resolves.toBeUndefined()
  })
})
