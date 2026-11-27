import { act } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { usePersistentSharedValue } from 'shared/mocks/usePersistentSharedValue'
import { BAR_ROW_MIN_HEIGHT } from 'shared/ui/layout'
import { useSearchSeparation } from './useSearchSeparation'

const TAB_BAR_HEIGHT = BAR_ROW_MIN_HEIGHT + 12
const ROW_GROWTH = 50

const createChannel = (value: number) => ({ value }) as unknown as SharedValue<number>

describe('useSearchSeparation', () => {
  beforeEach(() => {
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(usePersistentSharedValue as unknown as typeof useSharedValue)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('reads the tab-bar height through the pre-paint channel, not a closure', async () => {
    let heightChannel: SharedValue<number> | undefined

    const result = await renderHookWithProviders(() => {
      // Persistent per hook instance: the same channel survives the rerender,
      // like the real pre-paint mirror of the measured row.
      const tabBarHeight = useSharedValue(TAB_BAR_HEIGHT)
      heightChannel = tabBarHeight
      const { buttonStyle } = useSearchSeparation({
        contentWidth: createChannel(390),
        expandedSearchWidth: createChannel(80),
        expandedTabWidth: createChannel(80),
        oneLineProgress: createChannel(1),
        routeCount: 3,
        screenWidth: createChannel(390),
        separation: createChannel(0),
        tabBarHeight,
      })

      return buttonStyle
    })
    // The reanimated mock evaluates animated styles on the JS thread at render;
    // the handle is the geometry object there.
    const readBottom = (style: (typeof result.result)['current']) =>
      (style as unknown as { bottom: number }).bottom
    const initialBottom = readBottom(result.result.current)

    expect(initialBottom).toBe(TAB_BAR_HEIGHT - BAR_ROW_MIN_HEIGHT)

    // A re-measured row lands on the channel between commits: the worklet must
    // follow it in the same commit as the button's width and left, not through
    // a closure that re-registers afterwards (one stale frame of the circle).
    if (!heightChannel) throw new Error('height channel not captured')

    heightChannel.value = TAB_BAR_HEIGHT + ROW_GROWTH
    await act(async () => {
      result.rerender(undefined)
    })

    expect(readBottom(result.result.current)).toBe(initialBottom + ROW_GROWTH)
  })
})
