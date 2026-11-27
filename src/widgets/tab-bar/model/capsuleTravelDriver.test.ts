import { act } from '@testing-library/react-native'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { Platform } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { ctx } from 'shared/lib/reatom-ctx/ctx'
import { advanceMorphFrames, countActiveMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { hapticsEnabledAtom } from 'shared/model/settings'
import { getSlotRects } from '../lib/capsuleTravel'
import { stepCapsuleFrame } from '../lib/capsuleTravelFrame'
import { beginCapsuleTravel, createCapsuleFrameState } from '../lib/capsuleTravelState'
import { useCapsuleTravel } from '../lib/useCapsuleTravel'
import { capsuleTravelDriver } from './capsuleTravelDriver'

// `scheduleOnRN` is a real UI→JS hop: the tests own that boundary so a settle or
// a pass queued just before an interrupting press can be flushed LATE, after the
// new travel has already reset the driver.
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

const { __flushScheduledOnRN } = jest.requireMock<DeferredRNMock>('react-native-worklets')

const mockedImpactAsync = impactAsync as jest.MockedFunction<typeof impactAsync>

const countImpacts = (style: ImpactFeedbackStyle) =>
  mockedImpactAsync.mock.calls.filter(([callStyle]) => callStyle === style).length

const impactSequence = () => mockedImpactAsync.mock.calls.map(([style]) => style)

// Wide: [Слушать][Читать][Ещё][Поиск] — slot centres 54, 142, 230, 298.
const WIDE_INPUT = {
  activeRouteKey: 'listen',
  hideSearch: false,
  isExpanded: true,
  isSearchFocused: false,
  searchWidth: 48,
  tabRouteKeys: ['listen', 'read', 'more'],
  tabWidth: 88,
}

// Compact expanded: the island shares its width equally between four slots.
const COMPACT_INPUT = {
  ...WIDE_INPUT,
  searchWidth: 92.5,
  tabWidth: 92.5,
}

const advance = async (frameCount = 1, deltaMs = 50) => {
  await act(async () => {
    advanceMorphFrames(frameCount, deltaMs)
    __flushScheduledOnRN()
  })
}

// Frames without draining the UI→JS queue: models a press arriving while the
// previous travel's haptic callbacks are still waiting on the JS thread.
const advanceFramesOnly = async (frameCount = 1, deltaMs = 50) => {
  await act(async () => {
    advanceMorphFrames(frameCount, deltaMs)
  })
}

const flushScheduled = async () => {
  await act(async () => {
    __flushScheduledOnRN()
  })
}

const renderTravel = async (input: typeof WIDE_INPUT) =>
  renderHookWithProviders((props: typeof WIDE_INPUT) => useCapsuleTravel(props), {
    initialProps: input,
  })

describe('capsuleTravelDriver', () => {
  beforeEach(() => {
    // Drain anything left by the previous test before resetting the driver.
    __flushScheduledOnRN()
    capsuleTravelDriver.reset()
    jest.clearAllMocks()
  })

  test('seeds the capsule on the active slot without animating', async () => {
    await renderTravel({ ...WIDE_INPUT, activeRouteKey: 'more' })

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(230)
    expect(capsuleTravelDriver.capsuleWidth.value).toBe(100)
    expect(capsuleTravelDriver.travelActivity.value).toBe(0)
    expect(countActiveMorphFrames()).toBe(0)
  })

  test('travels through the intermediate slot centres instead of jumping', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(54)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    expect(capsuleTravelDriver.travelActivity.value).toBe(1)

    await advance()
    const first = capsuleTravelDriver.capsuleCenter.value

    // Fast-start ease: the first quarter of the 200ms travel already covers
    // ~44% of the distance, so the tap response reads as instant.
    expect(first - 54).toBeCloseTo(77, 5)

    await advance()
    const middle = capsuleTravelDriver.capsuleCenter.value

    // Half the time puts the capsule three quarters of the way.
    expect(middle).toBeCloseTo(186, 5)

    await advance()
    const last = capsuleTravelDriver.capsuleCenter.value

    expect(last).toBeCloseTo(219, 5)
  })

  test('overshoots past the target and springs back on arrival', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    // Four 50ms frames land the 200ms travel; the next two cover the 60ms
    // overshoot.
    await advance(4)

    expect(capsuleTravelDriver.capsuleCenter.value).toBeCloseTo(230, 5)
    expect(capsuleTravelDriver.arrivalPulse.value).toBe(0)

    await advance()
    const overshootCenter = capsuleTravelDriver.capsuleCenter.value

    // The capsule rides ~10% of its width past the target…
    expect(overshootCenter).toBeGreaterThan(235)
    // …while the arrival pulse peaks stronger than the travel pulse.
    expect(capsuleTravelDriver.arrivalPulse.value).toBeGreaterThan(0.9)

    await advance()
    expect(capsuleTravelDriver.arrivalPulse.value).toBe(1)
    expect(capsuleTravelDriver.capsuleCenter.value).toBeCloseTo(240, 5)

    await advance()
    expect(capsuleTravelDriver.capsuleCenter.value).toBeGreaterThan(230)
    expect(capsuleTravelDriver.capsuleCenter.value).toBeLessThan(235)

    await advance()
    expect(capsuleTravelDriver.capsuleCenter.value).toBeCloseTo(230, 5)
    expect(capsuleTravelDriver.arrivalPulse.value).toBe(0)
    expect(capsuleTravelDriver.travelActivity.value).toBe(0)
    expect(countActiveMorphFrames()).toBe(0)
  })

  test('snaps instead of traveling while the island is collapsed', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more', isExpanded: false })
    })

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(230)
    expect(capsuleTravelDriver.travelActivity.value).toBe(0)
    expect(countActiveMorphFrames()).toBe(0)
  })

  test('travels across equal compact shares too', async () => {
    const { rerender } = await renderTravel(COMPACT_INPUT)

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(56.25)

    await act(async () => {
      rerender({ ...COMPACT_INPUT, activeRouteKey: 'more' })
    })
    await advance()
    await advance()

    // Fast-start ease: half the 200ms choreography already covers three
    // quarters of the compact pitch to «Читать».
    expect(capsuleTravelDriver.capsuleCenter.value).toBeCloseTo(195, 5)
  })

  test('lands the search slot as a valid destination', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    await advance(10)

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(298)
    expect(capsuleTravelDriver.capsuleWidth.value).toBe(60)
  })

  test('starts traveling synchronously from the press path, before effects', async () => {
    const { result } = await renderTravel({ ...WIDE_INPUT, activeRouteKey: 'more' })

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(230)

    // A tab press calls requestTravel in the same tick: the frame state flips
    // immediately, without waiting for the route re-render effect.
    result.current.requestTravel('listen')

    expect(capsuleTravelDriver.travelActivity.value).toBe(1)
    expect(capsuleTravelDriver.capsuleCenter.value).toBe(230)
  })

  test('does not restart a press-started travel when the route effect catches up', async () => {
    const { rerender, result } = await renderTravel(WIDE_INPUT)

    result.current.requestTravel('more')
    await advance(2)
    const halfway = capsuleTravelDriver.capsuleCenter.value

    expect(halfway).toBeCloseTo(186, 5)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    // The effect reconciles without a second start: the remaining 100ms finishes
    // the same trip instead of replaying it from the halfway point.
    await advance(2)

    expect(capsuleTravelDriver.capsuleCenter.value).toBe(230)
  })

  test('fires the landing haptic on the visual arrival frame, without a route commit', async () => {
    const { result } = await renderTravel(WIDE_INPUT)

    // A press starts the travel; no navigation re-render happens in this test.
    result.current.requestTravel('more')
    // Four 50ms frames finish the 200ms travel into the overshoot; the spring
    // back is still in flight, so arrival must stay silent.
    await advance(4)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(0)

    // The return lands the capsule on the destination: one medium impact,
    // independent of when the route switch reaches React.
    await advance(4)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(1)
  })

  test('fires one light impact as the highlight crosses the single intermediate tab, then medium on landing', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    // The 200ms travel sweeps «Слушать» → «Ещё» across «Читать».
    await advance(4)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(1)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(0)

    await advance(4)

    // The pass does not repeat on the spring-back; the medium lands once.
    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(1)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(1)
  })

  test('fires one light impact per crossed tab, then one medium on landing', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    // «Читать» and «Ещё» sit between «Слушать» and «Поиск»: two distinct passes
    // inside the clamped 220ms travel.
    await advance(5)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(2)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(0)

    // The spring-back lands on the target without re-crossing a passed slot.
    await advance(6)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(2)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(1)
  })

  test('stays silent when the haptics setting is off', async () => {
    hapticsEnabledAtom(ctx, false)
    try {
      const { rerender } = await renderTravel(WIDE_INPUT)

      await act(async () => {
        rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
      })
      await advance(10)

      expect(mockedImpactAsync).not.toHaveBeenCalled()
    } finally {
      hapticsEnabledAtom(ctx, true)
    }
  })

  test('stays silent on web where expo-haptics has no native implementation', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const { rerender } = await renderTravel(WIDE_INPUT)

      await act(async () => {
        rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
      })
      await advance(10)

      expect(mockedImpactAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('keeps the exact light/medium sequence across sequential travels', async () => {
    const { rerender, result } = await renderTravel(WIDE_INPUT)

    // 0 → 3 («Слушать» → «Поиск»): two intermediates, then the landing.
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    await advance(10)

    expect(impactSequence()).toEqual([
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
    ])

    // 3 → 1 («Поиск» → «Читать»): one intermediate («Ещё»).
    result.current.requestTravel('read')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'read' })
    })
    await advance(9)

    expect(impactSequence()).toEqual([
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
    ])

    // 1 → 2 («Читать» → «Ещё»): adjacent, so no pass light at all.
    result.current.requestTravel('more')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    await advance(8)

    expect(impactSequence()).toEqual([
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
      ImpactFeedbackStyle.Medium,
    ])
  })

  test('does not replay the landing of a travel the next press superseded', async () => {
    const { rerender, result } = await renderTravel(WIDE_INPUT)

    // Travel A: «Слушать» → «Ещё», with its route render committed.
    result.current.requestTravel('more')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    // A lands, but its settle is still queued behind the busy JS thread.
    await advanceFramesOnly(8)
    expect(mockedImpactAsync).not.toHaveBeenCalled()

    // Travel B starts before A's stale callbacks flush.
    result.current.requestTravel('listen')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen' })
    })
    await advanceFramesOnly(8)

    await flushScheduled()

    // Only B's pass and landing are felt; A's stale settle must be dropped.
    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Medium])
  })

  test('drops a queued pass light when a rapid press aborts the travel', async () => {
    const { rerender, result } = await renderTravel(WIDE_INPUT)

    // Travel A: «Слушать» → «Ещё», first intermediate swept into the queue.
    result.current.requestTravel('more')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    await advanceFramesOnly(2)
    expect(mockedImpactAsync).not.toHaveBeenCalled()

    // A rapid press to «Слушать» aborts A before the queued light reaches JS.
    result.current.requestTravel('listen')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen' })
    })
    await flushScheduled()

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(0)
  })

  test('fires every swept pass exactly once when a frame skips several slots', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    // One clamped 100ms frame jumps «Слушать» across BOTH intermediates.
    await advance(1, 100)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(2)

    await advance(10)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(2)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(1)
  })
})

// Native-like shared values: a write made from the JS thread is applied to the
// UI thread on a later tick, so a JS travel start can land BETWEEN two UI frames
// and clobber pass state the UI already advanced. The sweep bookkeeping must
// therefore live on the UI thread alone.
const createRaceState = () => {
  const state = createCapsuleFrameState()
  const queued: Array<() => void> = []
  let isOnUIThread = false

  const threaded = <T>(init: T): SharedValue<T> => {
    let committed = init
    let latest = init

    return {
      addListener: () => {},
      get: () => (isOnUIThread ? committed : latest),
      modify: () => {},
      removeListener: () => {},
      set: next => {
        const value = typeof next === 'function' ? (next as (current: T) => T)(latest) : next

        latest = value

        if (!isOnUIThread) queued.push(() => (committed = value))
      },
      get value() {
        return isOnUIThread ? committed : latest
      },
      set value(next: T) {
        latest = next

        if (isOnUIThread) {
          committed = next

          return
        }

        queued.push(() => {
          committed = next
        })
      },
    } as SharedValue<T>
  }

  state.passCrossed = threaded<readonly boolean[]>([])
  state.previousCenter = threaded(0)

  return {
    flushJSWrites: () => {
      for (const apply of queued.splice(0)) apply()
    },
    runOnUI: <T>(fn: () => T) => {
      isOnUIThread = true

      try {
        return fn()
      } finally {
        isOnUIThread = false
      }
    },
    state,
  }
}

describe('capsule travel JS/UI race', () => {
  const FRAME_INFO = { timeSinceFirstFrame: 0, timeSincePreviousFrame: 50, timestamp: 0 }

  test('keeps the pass beats deterministic when JS starts a travel between frames', () => {
    const { flushJSWrites, runOnUI, state } = createRaceState()
    const slotRects = getSlotRects([88, 88, 88, 48], 10)
    const frame = () => runOnUI(() => stepCapsuleFrame(state, FRAME_INFO))
    const passesIn = (frameCount: number) =>
      Array.from({ length: frameCount }, () => frame().passedSlots)

    // Travel A: «Слушать» (54) → «Ещё» (230), one intermediate at 142.
    state.capsuleCenter.value = 54
    state.travelId.value = 1
    beginCapsuleTravel(state, { center: 230, width: 100 }, 2, slotRects)
    flushJSWrites()

    expect(passesIn(4)).toEqual([1, 0, 0, 0])

    // Travel B starts on the JS thread between two UI frames: only the
    // generation bump is expected to reach the UI reliably, so the pass reset
    // must happen on the UI thread's first frame of the new generation.
    state.travelId.value = 2
    beginCapsuleTravel(state, { center: 54, width: 100 }, 2, slotRects)

    const first = frame().passedSlots
    // The JS reset (old model) arrives LATE: mid-travel, after the UI already
    // swept the slot.
    flushJSWrites()
    const rest = passesIn(3)

    // Exactly one beat, on the first frame of B — not dropped, not replayed.
    expect([first, ...rest]).toEqual([1, 0, 0, 0])

    // The landing still fires once, after the spring back.
    const landing = Array.from({ length: 4 }, () => frame().landed)

    expect(landing.filter(Boolean)).toHaveLength(1)
  })
})
