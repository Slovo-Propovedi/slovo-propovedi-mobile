import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TabSlot } from './TabSlot'

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

const renderSlot = async ({
  expandedWidth = 100,
  isActive = false,
  isCollapsed = false,
  isSettledCollapsed = false,
  progress = 0,
} = {}) => {
  await renderWithProviders(
    <TabSlot
      isActive={isActive}
      isCollapsed={isCollapsed}
      expandedWidth={expandedWidth}
      progress={progressValue(progress)}
      isSettledCollapsed={isSettledCollapsed}
    >
      <Text>tab</Text>
    </TabSlot>,
  )

  const slot = screen.getByText('tab').parent

  if (!slot) throw new Error('slot not found')

  return slot
}

describe('<TabSlot>', () => {
  test('commits the settled geometry as the last style entry after the animated one', async () => {
    // Issue #152: on iPad Safari the animated slot style can freeze at the
    // expanded geometry mid-morph while the island shrinks. A React-committed
    // resting layer (same pattern as the island itself, Issue #63) still writes
    // the final slot geometry when the morph settles.
    const slot = await renderSlot({ progress: 0.5 })
    const style = slot.props.style as Array<Record<string, number>>

    expect(style).toHaveLength(2)
    // The animated layer follows the live mid-morph progress…
    expect(style[0]).toEqual({ minWidth: 24, opacity: 0.5, width: 50 })
    // …and the committed resting layer carries the SETTLED (start) geometry.
    expect(style[1]).toEqual({ minWidth: 48, opacity: 1, width: 100 })
  })

  test('rests the collapsed inactive slot at zero width and opacity', async () => {
    const slot = await renderSlot({ isCollapsed: true, isSettledCollapsed: true, progress: 1 })
    const style = slot.props.style as Array<Record<string, number>>

    expect(style.at(-1)).toEqual({ minWidth: 0, opacity: 0, width: 0 })
  })

  test('rests the collapsed active slot at the circle size', async () => {
    const slot = await renderSlot({
      isActive: true,
      isCollapsed: true,
      isSettledCollapsed: true,
      progress: 1,
    })
    const style = slot.props.style as Array<Record<string, number>>

    // Literal 64 (not BAR_CIRCLE_SIZE) guards the exact circle geometry.
    expect(style.at(-1)).toEqual({ minWidth: 0, opacity: 1, width: 64 })
  })

  test('gates touches of hidden slots inside the collapsed circle', async () => {
    const hidden = await renderSlot({ isCollapsed: true })

    expect(hidden.props.pointerEvents).toBe('none')

    const active = await renderSlot({ isActive: true, isCollapsed: true })

    expect(active.props.pointerEvents).toBe('auto')
  })
})
