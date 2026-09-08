import { createTrailingThrottle } from './runPlaylistCaching'

describe('createTrailingThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('fires once after the delay', () => {
    const fn = jest.fn()
    const throttle = createTrailingThrottle(fn, 300)

    throttle.trigger()
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('coalesces back-to-back triggers into a single trailing call', () => {
    const fn = jest.fn()
    const throttle = createTrailingThrottle(fn, 300)

    throttle.trigger()
    jest.advanceTimersByTime(100)
    throttle.trigger()
    jest.advanceTimersByTime(100)
    throttle.trigger()
    jest.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('flush fires immediately when a timer is pending', () => {
    const fn = jest.fn()
    const throttle = createTrailingThrottle(fn, 300)

    throttle.trigger()
    throttle.flush()

    expect(fn).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('flush is a no-op when no timer is pending', () => {
    const fn = jest.fn()
    const throttle = createTrailingThrottle(fn, 300)

    throttle.flush()
    expect(fn).not.toHaveBeenCalled()

    throttle.trigger()
    jest.advanceTimersByTime(300)
    throttle.flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('a trigger after the timer fired schedules a fresh call', () => {
    const fn = jest.fn()
    const throttle = createTrailingThrottle(fn, 300)

    throttle.trigger()
    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)

    throttle.trigger()
    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
