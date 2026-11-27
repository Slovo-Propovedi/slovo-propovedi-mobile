import { act } from '@testing-library/react-native'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { Platform } from 'react-native'
import { advanceMorphFrames, countActiveMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useCapsuleTravel } from '../lib/useCapsuleTravel'
import { capsuleTravelDriver } from './capsuleTravelDriver'

const mockedImpactAsync = impactAsync as jest.MockedFunction<typeof impactAsync>

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
  })
}

const renderTravel = async (input: typeof WIDE_INPUT) =>
  renderHookWithProviders((props: typeof WIDE_INPUT) => useCapsuleTravel(props), {
    initialProps: input,
  })

describe('capsuleTravelDriver', () => {
  beforeEach(() => {
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
    expect(mockedImpactAsync).not.toHaveBeenCalled()

    // The return lands the capsule on the destination: one medium impact,
    // independent of when the route switch reaches React.
    await advance(4)
    expect(mockedImpactAsync).toHaveBeenCalledTimes(1)
    expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Medium)
  })

  test('fires one medium impact on landing, never while passing slots', async () => {
    const { rerender } = await renderTravel(WIDE_INPUT)

    await act(async () => {
      rerender({ ...WIDE_INPUT, activeRouteKey: 'listen', isSearchFocused: true })
    })
    // Five 50ms frames finish the clamped 220ms travel, the next two cover the
    // overshoot — crossing «Читать» and «Ещё» must stay silent.
    await advance(7)
    expect(mockedImpactAsync).not.toHaveBeenCalled()

    // The spring-back lands on the target: exactly one medium impact.
    await advance(2)
    expect(mockedImpactAsync).toHaveBeenCalledTimes(1)
    expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Medium)

    await advance(3)
    expect(mockedImpactAsync).toHaveBeenCalledTimes(1)
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
})
