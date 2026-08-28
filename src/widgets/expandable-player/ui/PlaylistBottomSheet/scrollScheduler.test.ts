import { createScrollScheduler } from './scrollScheduler'

describe('createScrollScheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('scheduleNudge fires only after two frames', () => {
    const scheduler = createScrollScheduler()
    const cb = jest.fn()

    scheduler.scheduleNudge(cb)
    jest.advanceTimersByTime(0)
    expect(cb).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('scheduleTimer fires after the delay', () => {
    const scheduler = createScrollScheduler()
    const cb = jest.fn()

    scheduler.scheduleTimer(cb, 100)
    jest.advanceTimersByTime(99)
    expect(cb).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('clearAll cancels pending nudge and timers', () => {
    const scheduler = createScrollScheduler()
    const nudgeCb = jest.fn()
    const timerCb = jest.fn()

    scheduler.scheduleNudge(nudgeCb)
    scheduler.scheduleTimer(timerCb, 100)
    scheduler.clearAll()

    jest.advanceTimersByTime(1000)
    expect(nudgeCb).not.toHaveBeenCalled()
    expect(timerCb).not.toHaveBeenCalled()
  })
})
