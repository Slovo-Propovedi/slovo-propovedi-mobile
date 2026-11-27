import { act, render } from '@testing-library/react-native'
import { useEffect } from 'react'
import { Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'
import { usePersistentSharedValue } from 'shared/mocks/usePersistentSharedValue'
import { BAR_SIDE_INSET_EXPANDED } from 'shared/ui/layout'
import { getMiniBarStyle } from '../lib/getMiniBarStyle'
import { useGeometrySharedValues } from './useGeometrySharedValues'

const TAB_BAR_HEIGHT = 98

interface Dimensions {
  fullScreenHeight: number
  screenWidth: number
}

interface Observed {
  contentWidth: number
  fullScreenHeight: number
  pillWidth: number
  screenWidth: number
  tick: number
}

const Probe = ({
  contentWidthShared,
  fullScreenHeightShared,
  onObserved,
  screenWidthShared,
  tick,
}: {
  contentWidthShared: SharedValue<number>
  fullScreenHeightShared: SharedValue<number>
  onObserved: (observed: Observed) => void
  screenWidthShared: SharedValue<number>
  tick: SharedValue<number>
}) => {
  // Passive effect on purpose: it runs BEFORE the parent's passive effects, so
  // whatever it observes here was already visible during the layout phase.
  useEffect(() => {
    onObserved({
      contentWidth: contentWidthShared.value,
      fullScreenHeight: fullScreenHeightShared.value,
      pillWidth: getMiniBarStyle({
        barProgress: 0,
        contentWidth: contentWidthShared.value,
        fullScreenHeight: fullScreenHeightShared.value,
        screenWidth: screenWidthShared.value,
        tabBarHeight: TAB_BAR_HEIGHT,
        wideBottomInset: 0,
      }).width,
      screenWidth: screenWidthShared.value,
      tick: tick.value,
    })
  })

  return <Text>probe</Text>
}

const Harness = ({
  dimensions,
  onObserved,
}: {
  dimensions: Dimensions
  onObserved: (observed: Observed) => void
}) => {
  const geometryReapplyTick = useSharedValue(0)
  // The chrome content width is the window's short side (the layout base).
  const contentWidth = Math.min(dimensions.screenWidth, dimensions.fullScreenHeight)
  const { contentWidthShared, fullScreenHeightShared, screenWidthShared } = useGeometrySharedValues(
    {
      contentWidth,
      fullScreenHeight: dimensions.fullScreenHeight,
      geometryReapplyTick,
      screenWidth: dimensions.screenWidth,
    },
  )

  return (
    <Probe
      onObserved={onObserved}
      tick={geometryReapplyTick}
      screenWidthShared={screenWidthShared}
      contentWidthShared={contentWidthShared}
      fullScreenHeightShared={fullScreenHeightShared}
    />
  )
}

describe('useGeometrySharedValues', () => {
  beforeEach(() => {
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(usePersistentSharedValue as unknown as typeof Reanimated.useSharedValue)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const rotate = async (
    initial: Dimensions,
    rotated: Dimensions,
  ): Promise<{ observed: Observed[] }> => {
    const observed: Observed[] = []
    const onObserved = (value: Observed) => observed.push(value)
    const { rerender } = await render(<Harness dimensions={initial} onObserved={onObserved} />)

    observed.length = 0
    await act(async () => {
      await rerender(<Harness dimensions={rotated} onObserved={onObserved} />)
    })

    return { observed }
  }

  test('publishes rotated dimensions to worklets before the passive phase', async () => {
    const { observed } = await rotate(
      { fullScreenHeight: 390, screenWidth: 844 },
      { fullScreenHeight: 844, screenWidth: 390 },
    )
    const latest = observed[observed.length - 1]

    // The live window moves (centring + fullscreen sheet) while the chrome
    // content width stays the short side, so the pill is not resized.
    expect(latest.screenWidth).toBe(390)
    expect(latest.fullScreenHeight).toBe(844)
    expect(latest.contentWidth).toBe(390)
    // The geometry helpers size the pill from the frozen base, so the same
    // update already derives the portrait pill width instead of chasing the
    // native relayout with a landscape one.
    expect(latest.pillWidth).toBe(390 - BAR_SIDE_INSET_EXPANDED * 2)
  })

  test('keeps the pill content width through a phone rotation', async () => {
    const { observed } = await rotate(
      { fullScreenHeight: 844, screenWidth: 390 },
      { fullScreenHeight: 390, screenWidth: 844 },
    )
    const latest = observed[observed.length - 1]

    expect(latest.contentWidth).toBe(390)
    expect(latest.pillWidth).toBe(390 - BAR_SIDE_INSET_EXPANDED * 2)
  })

  test('bumps the heal tick in the same pre-paint update', async () => {
    const { observed } = await rotate(
      { fullScreenHeight: 800, screenWidth: 400 },
      { fullScreenHeight: 390, screenWidth: 844 },
    )

    expect(observed[observed.length - 1].tick).toBe(1)
  })

  test('keeps the tick untouched for an equal-dimension commit', async () => {
    const { observed } = await rotate(
      { fullScreenHeight: 800, screenWidth: 400 },
      { fullScreenHeight: 800, screenWidth: 400 },
    )

    expect(observed[observed.length - 1].tick).toBe(0)
  })
})
