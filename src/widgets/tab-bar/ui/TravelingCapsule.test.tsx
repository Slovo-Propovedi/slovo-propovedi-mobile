import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { getSlotRects } from '../lib/capsuleTravel'
import { TravelingCapsule } from './TravelingCapsule'

const CAPSULE_COLOR = 'rgba(241, 96, 49, 0.18)'
const RECTS = getSlotRects([88, 88, 88, 48])

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

const findCapsule = () =>
  screen.root?.queryAll(
    instance => StyleSheet.flatten(instance.props.style)?.backgroundColor === CAPSULE_COLOR,
  )[0]

const renderCapsule = async (progress: number, restingLeft = -6) => {
  await renderWithProviders(
    <TravelingCapsule
      progress={progressValue(progress)}
      resting={{ left: restingLeft, width: 100 }}
      motion={{
        arrivalPulse: progressValue(0),
        capsuleCenter: progressValue(44),
        capsuleWidth: progressValue(100),
        slotRects: RECTS,
        travelActivity: progressValue(0),
      }}
    />,
  )

  const capsule = findCapsule()

  if (!capsule) throw new Error('capsule not found')

  return capsule
}

describe('<TravelingCapsule>', () => {
  test('paints the shared active-tab capsule at the resting slot rect', async () => {
    const capsule = await renderCapsule(0)

    expect(capsule).toHaveStyle({
      backgroundColor: CAPSULE_COLOR,
      opacity: 1,
      transform: [{ translateX: -6 }],
      width: 100,
    })
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
