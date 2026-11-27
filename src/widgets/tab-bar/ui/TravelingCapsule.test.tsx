import { StyleSheet } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { getSlotRects } from '../lib/capsuleTravel'
import { TravelingCapsule } from './TravelingCapsule'

const CAPSULE_COLOR = 'rgba(241, 96, 49, 0.18)'
const RECTS = getSlotRects([88, 88, 88, 48], 10)

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

// The slot bleed widens the capsule past its slot: 12 total, so 6 per side.
// That per-side bleed is also the vertical inset the capsule must keep.
const SLOT_WIDTH = 88
const CAPSULE_BLEED_PER_SIDE = (() => {
  const slot = getSlotRects([SLOT_WIDTH], 10)[0]

  return slot ? (slot.capsuleWidth - slot.slotWidth) / 2 : 0
})()

const renderCapsule = async (
  progress: number,
  pulse: { arrivalPulse?: number; travelActivity?: number } = {},
) => {
  const { root } = await renderWithProviders(
    <TravelingCapsule
      resting={{ left: 4, width: 100 }}
      progress={progressValue(progress)}
      motion={{
        arrivalPulse: progressValue(pulse.arrivalPulse ?? 0),
        capsuleCenter: progressValue(54),
        capsuleWidth: progressValue(100),
        slotRects: RECTS,
        travelActivity: progressValue(pulse.travelActivity ?? 0),
      }}
    />,
  )

  const capsule = root?.queryAll(
    instance => StyleSheet.flatten(instance.props.style)?.backgroundColor === CAPSULE_COLOR,
  )[0]

  if (!capsule) throw new Error('capsule not found')

  return capsule
}

interface StyleEntry {
  transform?: readonly unknown[]
}

const collectStyles = (style: unknown): StyleEntry[] => {
  if (Array.isArray(style)) return style.flatMap(collectStyles)

  return typeof style === 'object' && style !== null ? ([style] as StyleEntry[]) : []
}

const readTravelScale = (capsule: Awaited<ReturnType<typeof renderCapsule>>) => {
  // The mock flattens style arrays, so the committed resting twin (last) would
  // shadow the animated transform. Read the animated travel entry directly.
  const scales = collectStyles(capsule.props.style)
    .flatMap(entry => entry.transform ?? [])
    .filter(
      (entry): entry is { scale: number } =>
        typeof entry === 'object' && entry !== null && 'scale' in entry,
    )

  return scales[0]?.scale ?? 1
}

describe('<TravelingCapsule>', () => {
  test('paints the shared active-tab capsule at the resting slot rect', async () => {
    const capsule = await renderCapsule(0)

    expect(capsule).toHaveStyle({
      backgroundColor: CAPSULE_COLOR,
      opacity: 1,
      transform: [{ translateX: 4 }],
      width: 100,
    })
  })

  test('insets the capsule vertically as much as its horizontal bleed per side', async () => {
    const capsule = await renderCapsule(0)
    const style = StyleSheet.flatten(capsule.props.style)

    // Equal to the 6dp the slot bleed adds on each horizontal side, so the
    // highlight keeps symmetric breathing room instead of filling the island.
    expect(CAPSULE_BLEED_PER_SIDE).toBe(6)
    expect(style.top).toBe(CAPSULE_BLEED_PER_SIDE)
    expect(style.bottom).toBe(CAPSULE_BLEED_PER_SIDE)
  })

  test('grows past its base height on the pulse peak', async () => {
    const rest = await renderCapsule(0)
    const peak = await renderCapsule(0, { arrivalPulse: 1, travelActivity: 1 })

    expect(readTravelScale(rest)).toBe(1)
    expect(readTravelScale(peak)).toBeGreaterThan(readTravelScale(rest))
  })

  test('is inert while the island is collapsed', async () => {
    const capsule = await renderCapsule(1)

    // The collapsed circle keeps its own highlight; the traveling capsule fades
    // out together with the island instead of painting a pill inside the circle.
    expect(capsule).toHaveStyle({ opacity: 0 })
  })

  test('never intercepts touches', async () => {
    const capsule = await renderCapsule(0)

    expect(capsule.props.pointerEvents).toBe('none')
  })
})
