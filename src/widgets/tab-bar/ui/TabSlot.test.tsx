import { act, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { type SharedValue } from 'react-native-reanimated'
import * as layoutEffectSharedValue from 'shared/lib/hooks/useLayoutEffectSharedValue'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { usePersistentSharedValue } from 'shared/mocks/usePersistentSharedValue'
import { TAB_BAR_ISLAND_HEIGHT, TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
import { TabSlot } from './TabSlot'

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

const renderSlot = async ({
  expandedWidth = 100,
  isActive = false,
  isCollapsed = false,
  isSettledCollapsed = false,
  isSettledOneLine = false,
  oneLineProgress = 0,
  progress = 0,
} = {}) => {
  await renderWithProviders(
    <TabSlot
      isActive={isActive}
      isCollapsed={isCollapsed}
      expandedWidth={expandedWidth}
      progress={progressValue(progress)}
      isSettledOneLine={isSettledOneLine}
      isSettledCollapsed={isSettledCollapsed}
      oneLineProgress={progressValue(oneLineProgress)}
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
    expect(style[0]).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 24,
      opacity: 0.5,
      width: 50,
    })
    // …and the committed resting layer carries the SETTLED (start) geometry.
    expect(style[1]).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 48,
      opacity: 1,
      width: 100,
    })
  })

  test('rests the collapsed inactive slot at zero width and opacity', async () => {
    const slot = await renderSlot({ isCollapsed: true, isSettledCollapsed: true, progress: 1 })
    const style = slot.props.style as Array<Record<string, number>>

    expect(style.at(-1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 0,
      opacity: 0,
      width: 0,
    })
  })

  test('rests the collapsed active slot at the island diameter of the open-field row', async () => {
    const slot = await renderSlot({
      isActive: true,
      isCollapsed: true,
      isSettledCollapsed: true,
      oneLineProgress: 0,
      progress: 1,
    })
    const style = slot.props.style as Array<Record<string, number>>

    // A visible field forces the circle shape but keeps the expanded height:
    // the active slot must span the 68 island, not the compact 48.
    expect(style.at(-1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      minWidth: 0,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    })
  })

  test('rests the collapsed active slot at the compact 48 circle in the one-line row', async () => {
    const slot = await renderSlot({
      isActive: true,
      isCollapsed: true,
      isSettledCollapsed: true,
      isSettledOneLine: true,
      oneLineProgress: 1,
      progress: 1,
    })
    const style = slot.props.style as Array<Record<string, number>>

    // Pinned to the shared compact constant: the collapsed slot must match the
    // circle exactly, so a stray circle resize breaks this test.
    expect(style.at(-1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      minWidth: 0,
      opacity: 1,
      width: TAB_BAR_ISLAND_HEIGHT,
    })
  })

  test('gates touches of hidden slots inside the collapsed circle', async () => {
    const hidden = await renderSlot({ isCollapsed: true })

    expect(hidden.props.pointerEvents).toBe('none')

    const active = await renderSlot({ isActive: true, isCollapsed: true })

    expect(active.props.pointerEvents).toBe('auto')
  })

  test('publishes the slot width to the worklet channel before paint', async () => {
    // The animated layer must not run on a closure re-registered after the
    // commit: a real resize then paints one frame at the previous width while
    // the resting layer already carries the new one. The persistent shared
    // value reproduces the engine's cross-render identity, so the assertion
    // below observes the pre-paint write instead of a fresh per-render value.
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(usePersistentSharedValue as unknown as typeof Reanimated.useSharedValue)
    const channelSpy = jest.spyOn(layoutEffectSharedValue, 'useLayoutEffectSharedValue')

    try {
      const renderAt = (expandedWidth: number) => (
        <TabSlot
          isActive={false}
          isCollapsed={false}
          isSettledOneLine={false}
          isSettledCollapsed={false}
          progress={progressValue(0)}
          expandedWidth={expandedWidth}
          oneLineProgress={progressValue(0)}
        >
          <Text>tab</Text>
        </TabSlot>
      )
      const { rerender } = await renderWithProviders(renderAt(100))

      await act(async () => {
        rerender(renderAt(50))
      })

      // The channel received the rendered width in the layout phase of THIS
      // commit, and the resting layer carries the same number.
      expect(channelSpy).toHaveBeenLastCalledWith(50)
      expect(channelSpy.mock.results.at(-1)?.value?.value).toBe(50)

      const slot = screen.getByText('tab').parent

      expect((slot?.props.style as Array<Record<string, number>>).at(-1)?.width).toBe(50)
    } finally {
      jest.restoreAllMocks()
    }
  })
})
