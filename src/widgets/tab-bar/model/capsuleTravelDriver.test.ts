import { act } from '@testing-library/react-native'
import { advanceMorphFrames, countActiveMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useCapsuleTravel } from '../lib/useCapsuleTravel'
import { capsuleTravelDriver } from './capsuleTravelDriver'

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

    await advance()
    const middle = capsuleTravelDriver.capsuleCenter.value

    // Half of the 200ms two-slot travel lands exactly on «Читать»'s centre.
    expect(first).toBeGreaterThan(54)
    expect(first).toBeLessThan(142)
    expect(middle).toBeCloseTo(142, 5)

    await advance()
    const last = capsuleTravelDriver.capsuleCenter.value

    expect(last).toBeGreaterThan(142)
    expect(last).toBeLessThan(230)
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

    // The capsule rides ~18% of its width past the target…
    expect(overshootCenter).toBeGreaterThan(240)
    // …while the arrival pulse peaks stronger than the travel pulse.
    expect(capsuleTravelDriver.arrivalPulse.value).toBeGreaterThan(0.9)

    await advance()
    expect(capsuleTravelDriver.arrivalPulse.value).toBe(1)
    expect(capsuleTravelDriver.capsuleCenter.value).toBeCloseTo(248, 5)

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

    // Same 200ms choreography puts the capsule on «Читать»'s compact centre.
    expect(capsuleTravelDriver.capsuleCenter.value).toBeCloseTo(148.75, 5)
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
})
