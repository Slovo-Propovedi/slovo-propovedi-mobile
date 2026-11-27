import { act } from '@testing-library/react-native'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { Platform } from 'react-native'
import { ctx } from 'shared/lib/reatom-ctx/ctx'
import { advanceMorphFrames, countActiveMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { hapticsEnabledAtom } from 'shared/model/settings'
import { useCapsuleTravel } from '../lib/useCapsuleTravel'
import { capsuleTravelDriver } from './capsuleTravelDriver'

// `scheduleOnRN` is a real UI→JS hop: the tests own that boundary so a beat
// queued just before an interrupting press can be flushed LATE, after the new
// travel has already reset the driver.
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

  test('adjacent travel fires exactly one Medium at the end', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'read' })
    })
    // Distance 1 → one beat at 100% of the 150ms travel: the landing itself.
    await advance(2)

    expect(impactSequence()).toEqual([])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Medium])

    // The spring-back adds nothing.
    await advance(4)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Medium])
  })

  test('distance two splits the travel in half: Light at 50%, Medium at 100%', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    await advance(1)

    expect(impactSequence()).toEqual([])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Medium])
  })

  test('distance three splits the travel in thirds: Light, Light, Medium', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    // 220ms travel: 1/3 ≈ 73ms, 2/3 ≈ 147ms, 3/3 = 220ms.
    await advance(1)

    expect(impactSequence()).toEqual([])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Light])

    await advance(1)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Light])

    await advance(1)

    expect(impactSequence()).toEqual([
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
    ])
  })

  test('fires the landing beat on the arrival frame, without a route commit', async () => {
    const { result } = await renderTravel(WIDE_INPUT)

    // A press starts the travel; no navigation re-render happens in this test.
    result.current.requestTravel('more')
    // Distance 2 → Light at half the 200ms travel, Medium at the arrival.
    await advance(2)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light])

    await advance(2)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Medium])

    // The spring-back is silent.
    await advance(4)

    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Medium])
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

    // 0 → 3 («Слушать» → «Поиск»): distance 3 → Light, Light, Medium.
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    await advance(10)

    expect(impactSequence()).toEqual([
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Light,
      ImpactFeedbackStyle.Medium,
    ])

    // 3 → 1 («Поиск» → «Читать»): distance 2 → Light, Medium.
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

    // 1 → 2 («Читать» → «Ещё»): adjacent → only the Medium landing.
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
    // A completes, but its beats/settle are still queued behind the busy JS
    // thread.
    await advanceFramesOnly(8)
    expect(mockedImpactAsync).not.toHaveBeenCalled()

    // Travel B starts before A's stale callbacks flush.
    result.current.requestTravel('listen')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen' })
    })
    await advanceFramesOnly(8)

    await flushScheduled()

    // Only B's beats are felt; A's stale light and landing are dropped.
    expect(impactSequence()).toEqual([ImpactFeedbackStyle.Light, ImpactFeedbackStyle.Medium])
  })

  test('drops a queued light beat when a rapid press aborts the travel', async () => {
    const { rerender, result } = await renderTravel(WIDE_INPUT)

    // Travel A: «Слушать» → «Ещё», its half-way beat queued.
    result.current.requestTravel('more')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'more' })
    })
    await advanceFramesOnly(2)
    expect(mockedImpactAsync).not.toHaveBeenCalled()

    // A rapid press to «Слушать» aborts A before the queued beat reaches JS.
    result.current.requestTravel('listen')
    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen' })
    })
    await flushScheduled()

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(0)
  })

  test('spaces the beats by time, not by swept distance', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    // One long 100ms frame reaches 45% of the 220ms travel: only the first
    // third boundary is due, not both intermediate slots.
    await advance(1, 100)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(1)

    await advance(10)

    expect(countImpacts(ImpactFeedbackStyle.Light)).toBe(2)
    expect(countImpacts(ImpactFeedbackStyle.Medium)).toBe(1)
  })
})
