import { act, render } from '@testing-library/react-native'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'
import { BAR_SIDE_INSET_EXPANDED, CONTENT_COLUMN_WIDTH } from 'shared/ui/layout'
import { getMiniBarStyle } from '../lib/getMiniBarStyle'
import { useGeometrySharedValues } from './useGeometrySharedValues'

const TAB_BAR_HEIGHT = 98

interface Dimensions {
  fullScreenHeight: number
  screenWidth: number
}

interface Observed {
  fullScreenHeight: number
  pillWidth: number
  screenWidth: number
  tick: number
}

// The shared reanimated mock rebuilds `useSharedValue` on every render, which
// hides the real engine's persistence: a channel written only in a passive
// effect stays stale for the commit that follows a rotation. Persisting the
// value per hook instance reproduces that ordering.
const usePersistentSharedValue = (initial: number) => {
  const [holder] = useState(() => ({ value: initial }))

  return holder
}

const Probe = ({
  fullScreenHeightShared,
  onObserved,
  screenWidthShared,
  tick,
}: {
  fullScreenHeightShared: SharedValue<number>
  onObserved: (observed: Observed) => void
  screenWidthShared: SharedValue<number>
  tick: SharedValue<number>
}) => {
  // Passive effect on purpose: it runs BEFORE the parent's passive effects, so
  // whatever it observes here was already visible during the layout phase.
  useEffect(() => {
    onObserved({
      fullScreenHeight: fullScreenHeightShared.value,
      pillWidth: getMiniBarStyle({
        barProgress: 0,
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
  const { fullScreenHeightShared, screenWidthShared } = useGeometrySharedValues({
    fullScreenHeight: dimensions.fullScreenHeight,
    geometryReapplyTick,
    screenWidth: dimensions.screenWidth,
  })

  return (
    <Probe
      onObserved={onObserved}
      tick={geometryReapplyTick}
      screenWidthShared={screenWidthShared}
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
      { fullScreenHeight: 800, screenWidth: 400 },
      { fullScreenHeight: 390, screenWidth: 844 },
    )
    const latest = observed[observed.length - 1]

    expect(latest.screenWidth).toBe(844)
    expect(latest.fullScreenHeight).toBe(390)
    // The geometry helpers read those channels, so the same update already
    // derives the rotated pill width instead of the previous one.
    expect(latest.pillWidth).toBe(CONTENT_COLUMN_WIDTH - BAR_SIDE_INSET_EXPANDED * 2)
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
