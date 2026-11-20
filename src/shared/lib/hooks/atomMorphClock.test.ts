import { type FrameInfo } from 'react-native-reanimated'
import { type AtomMorphClock, createAtomMorphClock } from './atomMorphClock'

// Native-like shared values: a write made from JS is only queued until the UI
// thread applies it, so a same-tick JS read still returns the last flushed
// value. On web `makeMutable` is synchronous and this stale window does not
// exist — which is why the Android regression was invisible to the old tests.
jest.mock('react-native-reanimated', () => {
  const pendingWrites: Array<() => void> = []
  let isOnUIThread = false

  const makeMutable = (init: unknown) => {
    let committed = init
    let latest = init

    return {
      get value() {
        return isOnUIThread ? latest : committed
      },
      set value(next: unknown) {
        latest = next

        if (isOnUIThread) {
          committed = next

          return
        }

        pendingWrites.push(() => {
          committed = next
        })
      },
    }
  }

  return {
    __esModule: true,
    __flushUI: () => {
      for (const apply of pendingWrites.splice(0)) apply()
    },
    __runOnUI: (fn: () => void) => {
      isOnUIThread = true

      try {
        fn()
      } finally {
        isOnUIThread = false
      }
    },
    makeMutable,
  }
})

// `scheduleOnRN` really is an async hop from the UI thread to JS; the tests
// own that boundary so a settle can be made to arrive after an interrupting
// start.
jest.mock('react-native-worklets', () => {
  const scheduled: Array<() => void> = []

  return {
    __esModule: true,
    __flushScheduledOnRN: () => {
      for (const run of scheduled.splice(0)) run()
    },
    scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) => {
      scheduled.push(() => fn(...args))
    },
    scheduleOnUI: (fn: (...args: unknown[]) => void, ...args: unknown[]) => fn(...args),
  }
})

interface DeferredRNMock {
  __flushScheduledOnRN: () => void
}

interface StaleUIMock {
  __flushUI: () => void
  __runOnUI: (fn: () => void) => void
}

const { __flushUI, __runOnUI } = jest.requireMock<StaleUIMock>('react-native-reanimated')
const { __flushScheduledOnRN } = jest.requireMock<DeferredRNMock>('react-native-worklets')

const DURATION_MS = 300
const FRAME_MS = 100
const FRAME_INFO: FrameInfo = {
  timeSinceFirstFrame: 0,
  timeSincePreviousFrame: FRAME_MS,
  timestamp: 0,
}

const createClock = (onSettled = jest.fn()) =>
  createAtomMorphClock({ durationMs: DURATION_MS, onSettled })

const stepFrame = (clock: AtomMorphClock) => __runOnUI(() => clock.frameStep(FRAME_INFO))

const advanceLanding = (clock: AtomMorphClock) => {
  // Fractional steps need a fourth frame to hit the exact target.
  for (let frame = 0; frame < 4; frame++) stepFrame(clock)
}

beforeEach(() => {
  __flushUI()
  __flushScheduledOnRN()
})

describe('createAtomMorphClock', () => {
  test('activates the primary host on start before the UI thread flushes', () => {
    const clock = createClock()
    const host = { setActive: jest.fn() }
    clock.attachFrameHost(host)
    host.setActive.mockClear()

    clock.start(1)

    expect(host.setActive).toHaveBeenCalledWith(true)
  })

  test('advances progress per frame and settles once for the target', () => {
    const onSettled = jest.fn()
    const clock = createClock(onSettled)
    const host = { setActive: jest.fn() }
    clock.attachFrameHost(host)
    clock.start(1)
    __flushUI()

    stepFrame(clock)
    expect(clock.progress.value).toBeCloseTo(1 / 3)

    advanceLanding(clock)
    __flushScheduledOnRN()

    expect(clock.progress.value).toBe(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(true)
    expect(host.setActive).toHaveBeenLastCalledWith(false)
  })

  test('ignores a settle whose generation was superseded before it reached JS', () => {
    const onSettled = jest.fn()
    const clock = createClock(onSettled)
    clock.attachFrameHost({ setActive: jest.fn() })
    clock.start(1)
    __flushUI()

    advanceLanding(clock)
    // The tap lands between the frame scheduling the settle and the JS run.
    clock.start(0)
    __flushScheduledOnRN()

    expect(onSettled).not.toHaveBeenCalled()
  })

  test('snapTo deactivates hosts immediately and lands the value after flush', () => {
    const clock = createClock()
    const host = { setActive: jest.fn() }
    clock.attachFrameHost(host)
    clock.start(1)
    __flushUI()
    host.setActive.mockClear()

    clock.snapTo(0)

    expect(host.setActive).toHaveBeenCalledWith(false)

    __flushUI()
    expect(clock.progress.value).toBe(0)
  })
})
