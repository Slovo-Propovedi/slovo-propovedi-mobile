import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { AppState, type AppStateStatus, Text } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import {
  BAR_CIRCLE_SIZE,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getContainerGeometryStyle } from '../lib/getContainerGeometryStyle'
import { useExpandAnimation } from './useExpandAnimation'

const TAB_BAR_HEIGHT = 98
const PILL_RADIUS = PLAYER_SIZES.miniPlayerHeight / 2
const EXPANDED_BOTTOM = TAB_BAR_HEIGHT - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_OUTER_GAP
const COLLAPSED_BOTTOM = TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2
const COLLAPSED_LEFT = BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP

const mockedWithTiming = withTiming as jest.Mock

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: 400 }),
}))

jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    get: () => ({ height: 800, width: 400 }),
    removeEventListener: jest.fn(),
  },
}))

const mockListeners: Array<(state: AppStateStatus) => void> = []

beforeEach(() => {
  mockListeners.length = 0
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event: string, listener: (state: AppStateStatus) => void) => {
      mockListeners.push(listener)
      return { remove: jest.fn() }
    })
})

afterEach(() => {
  jest.restoreAllMocks()
})

const emitState = (state: AppStateStatus) => {
  for (const listener of mockListeners) listener(state)
}

// Capture progress shared value from the hook via a component that also
// renders it as text so we can re-render and re-read after state changes
const CollapsedHarness = ({ onProgress }: { onProgress: (p: { value: number }) => void }) => {
  const { progress } = useExpandAnimation(false, TAB_BAR_HEIGHT)
  onProgress(progress)
  return <Text testID='harness'>{String(progress.value)}</Text>
}

const ExpandedHarness = ({ onProgress }: { onProgress: (p: { value: number }) => void }) => {
  const { progress } = useExpandAnimation(true, TAB_BAR_HEIGHT)
  onProgress(progress)
  return <Text testID='harness'>{String(progress.value)}</Text>
}

describe('useExpandAnimation foreground snap', () => {
  let capturedProgress: { value: number }

  const trackProgress = (p: { value: number }) => {
    capturedProgress = p
  }

  beforeEach(() => {
    capturedProgress = { value: 0 }
  })

  test('snaps progress to 0 when AppState becomes active while collapsed', async () => {
    await renderWithProviders(<CollapsedHarness onProgress={trackProgress} />)

    // Simulate a stale mid-animation value
    capturedProgress.value = 0.5

    // Clear call history from render so we only measure the snap path
    mockedWithTiming.mockClear()

    await act(async () => {
      emitState('active')
    })

    expect(capturedProgress.value).toBe(0)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('snaps progress to 1 when AppState becomes active while expanded', async () => {
    await renderWithProviders(<ExpandedHarness onProgress={trackProgress} />)

    // Simulate a stale mid-animation value
    capturedProgress.value = 0.5

    // Clear call history from render so we only measure the snap path
    mockedWithTiming.mockClear()

    await act(async () => {
      emitState('active')
    })

    expect(capturedProgress.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('does not snap on non-active state transitions', async () => {
    await renderWithProviders(<CollapsedHarness onProgress={trackProgress} />)

    capturedProgress.value = 0.5

    await act(async () => {
      emitState('background')
    })

    expect(capturedProgress.value).toBe(0.5)
  })
})

describe('useExpandAnimation restingContainerStyle', () => {
  const renderResting = async (barCollapsed: boolean) => {
    let capturedResult: null | ReturnType<typeof useExpandAnimation> = null
    const ctx = createCtx()
    setBarCollapsed(ctx, barCollapsed)

    const Harness = ({
      onResult,
    }: {
      onResult: (r: ReturnType<typeof useExpandAnimation>) => void
    }) => {
      const result = useExpandAnimation(false, TAB_BAR_HEIGHT)
      onResult(result)
      return <Text testID='harness'>{String(result.progress.value)}</Text>
    }

    await renderWithProviders(
      <Harness
        onResult={r => {
          capturedResult = r
        }}
      />,
      { ctx },
    )

    return capturedResult
  }

  test('returns the detached pill geometry when the bar is expanded', async () => {
    const result = await renderResting(false)

    expect(result).not.toBeNull()
    expect(result).toMatchObject({
      barCollapsedTop: 800 - COLLAPSED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      barExpandedTop: 800 - EXPANDED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      restingContainerStyle: {
        borderBottomLeftRadius: PILL_RADIUS,
        borderBottomRightRadius: PILL_RADIUS,
        borderTopLeftRadius: PILL_RADIUS,
        borderTopRightRadius: PILL_RADIUS,
        bottom: EXPANDED_BOTTOM,
        left: BAR_SIDE_INSET,
        top: 800 - EXPANDED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
        width: 400 - BAR_SIDE_INSET * 2,
      },
    })
  })

  test('restates the collapsed pill geometry when the bar is collapsed', async () => {
    const result = await renderResting(true)

    expect(result).not.toBeNull()
    expect(result).toMatchObject({
      miniBarRestingStyle: {
        borderRadius: PILL_RADIUS,
        bottom: COLLAPSED_BOTTOM,
        left: COLLAPSED_LEFT,
        width: 400 - COLLAPSED_LEFT * 2,
      },
      restingContainerStyle: {
        borderBottomLeftRadius: PILL_RADIUS,
        borderBottomRightRadius: PILL_RADIUS,
        borderTopLeftRadius: PILL_RADIUS,
        borderTopRightRadius: PILL_RADIUS,
        bottom: COLLAPSED_BOTTOM,
        left: COLLAPSED_LEFT,
        top: 800 - COLLAPSED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
        width: 400 - COLLAPSED_LEFT * 2,
      },
    })
  })
})

describe('useExpandAnimation bar-morph resting commit', () => {
  const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
    toValue: number,
    config: unknown,
    callback?: (finished: boolean) => void,
  ) => number

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  const COLLAPSED_RESTING = {
    bottom: COLLAPSED_BOTTOM,
    left: COLLAPSED_LEFT,
    width: 400 - COLLAPSED_LEFT * 2,
  }
  const EXPANDED_RESTING = {
    bottom: EXPANDED_BOTTOM,
    left: BAR_SIDE_INSET,
    width: 400 - BAR_SIDE_INSET * 2,
  }

  const renderBarFlip = async (initialBarCollapsed: boolean) => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })

    const renders: Array<ReturnType<typeof useExpandAnimation>> = []
    const ctx = createCtx()
    setBarCollapsed(ctx, initialBarCollapsed)

    const Harness = () => {
      const result = useExpandAnimation(false, TAB_BAR_HEIGHT)
      renders.push(result)
      return <Text testID='harness'>{String(result.progress.value)}</Text>
    }

    const { rerender } = await renderWithProviders(<Harness />, { ctx })
    const flipRenderIndex = renders.length
    await act(async () => {
      setBarCollapsed(ctx, !initialBarCollapsed)
    })
    await rerender(<Harness />)

    return { completions, flipRender: renders[flipRenderIndex], renders }
  }

  test('keeps the collapsed resting geometry until the expand morph settles', async () => {
    const { completions, flipRender, renders } = await renderBarFlip(true)

    // The flip render must not commit the destination geometry: the animated
    // layer still holds the collapsed value for a frame, so committing the
    // detached geometry here paints the pill at its destination, then snaps it
    // back to the collapsed line and morphs again (the search-open flash).
    expect(flipRender.miniBarRestingStyle).toMatchObject(COLLAPSED_RESTING)
    expect(flipRender.restingContainerStyle).toMatchObject(COLLAPSED_RESTING)

    await act(async () => {
      completions[0](true)
    })

    const settledRender = renders[renders.length - 1]
    expect(settledRender.miniBarRestingStyle).toMatchObject(EXPANDED_RESTING)
    expect(settledRender.restingContainerStyle).toMatchObject(EXPANDED_RESTING)
  })

  test('keeps the detached resting geometry until the collapse morph settles', async () => {
    const { completions, flipRender, renders } = await renderBarFlip(false)

    expect(flipRender.miniBarRestingStyle).toMatchObject(EXPANDED_RESTING)
    expect(flipRender.restingContainerStyle).toMatchObject(EXPANDED_RESTING)

    await act(async () => {
      completions[0](true)
    })

    const settledRender = renders[renders.length - 1]
    expect(settledRender.miniBarRestingStyle).toMatchObject(COLLAPSED_RESTING)
    expect(settledRender.restingContainerStyle).toMatchObject(COLLAPSED_RESTING)
  })
})

describe('useExpandAnimation first committed frame', () => {
  test('starts the pill and container at the resting geometry', async () => {
    const captured: { current: null | ReturnType<typeof useExpandAnimation> } = {
      current: null,
    }

    const Harness = ({
      onResult,
    }: {
      onResult: (result: ReturnType<typeof useExpandAnimation>) => void
    }) => {
      const result = useExpandAnimation(false, TAB_BAR_HEIGHT)
      onResult(result)
      return <Text testID='harness'>{String(result.progress.value)}</Text>
    }

    await renderWithProviders(
      <Harness
        onResult={result => {
          captured.current = result
        }}
      />,
    )
    const result = captured.current
    if (!result) throw new Error('useExpandAnimation did not render')

    // No frame may paint the pill anywhere but its resting spot: the animated
    // layer's very first values must already agree with the React resting layer.
    const restingTop = 800 - EXPANDED_BOTTOM - PLAYER_SIZES.miniPlayerHeight
    const containerStyle = result.containerStyle as unknown as {
      bottom: number
      left: number
      opacity: number
      top: number
      width: number
    }

    expect(result.miniBarStyle).toEqual(result.miniBarRestingStyle)
    expect(containerStyle).toMatchObject({
      bottom: EXPANDED_BOTTOM,
      left: BAR_SIDE_INSET,
      width: 400 - BAR_SIDE_INSET * 2,
    })
    // Regression: the collapsed container is a solid `surface` rectangle sitting
    // exactly under the translucent mini pill, so the pill's BlurView only saw a
    // solid layer and the "glass" looked opaque. At rest the container must be
    // fully transparent; the mini player is the only paint over the page.
    expect(containerStyle.opacity).toBe(0)
    expect(containerStyle.top).toBeCloseTo(restingTop, 1)
  })
})

describe('useExpandAnimation container visibility', () => {
  const renderContainerOpacity = async (expanded: boolean) => {
    const captured: { current: null | ReturnType<typeof useExpandAnimation> } = { current: null }

    const Harness = ({
      onResult,
    }: {
      onResult: (result: ReturnType<typeof useExpandAnimation>) => void
    }) => {
      const result = useExpandAnimation(expanded, TAB_BAR_HEIGHT)
      onResult(result)
      return <Text testID='harness'>{String(result.progress.value)}</Text>
    }

    await renderWithProviders(
      <Harness
        onResult={result => {
          captured.current = result
        }}
      />,
    )

    const result = captured.current
    if (!result) throw new Error('useExpandAnimation did not render')

    return (result.containerStyle as unknown as { opacity: number }).opacity
  }

  test('keeps the collapsed container transparent so the pill glass shows the page', async () => {
    expect(await renderContainerOpacity(false)).toBe(0)
  })
})

describe('getContainerGeometryStyle (expand interpolation)', () => {
  const geometry = (barProgress: number, progress: number) =>
    getContainerGeometryStyle({
      barProgress,
      fullScreenHeight: 800,
      progress,
      screenWidth: 400,
      tabBarHeight: TAB_BAR_HEIGHT,
    })

  test('starts from the expanded resting pill', () => {
    expect(geometry(0, 0)).toEqual({
      borderBottomLeftRadius: PILL_RADIUS,
      borderBottomRightRadius: PILL_RADIUS,
      borderTopLeftRadius: PILL_RADIUS,
      borderTopRightRadius: PILL_RADIUS,
      bottom: EXPANDED_BOTTOM,
      left: BAR_SIDE_INSET,
      top: 800 - EXPANDED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      width: 400 - BAR_SIDE_INSET * 2,
    })
  })

  test('starts from the collapsed resting pill', () => {
    expect(geometry(1, 0)).toEqual({
      borderBottomLeftRadius: PILL_RADIUS,
      borderBottomRightRadius: PILL_RADIUS,
      borderTopLeftRadius: PILL_RADIUS,
      borderTopRightRadius: PILL_RADIUS,
      bottom: COLLAPSED_BOTTOM,
      left: COLLAPSED_LEFT,
      top: 800 - COLLAPSED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      width: 400 - COLLAPSED_LEFT * 2,
    })
  })

  test('interpolates upward from the collapsed pill when expanding', () => {
    const style = geometry(1, 0.5)

    expect(style.bottom).toBe(COLLAPSED_BOTTOM / 2)
    expect(style.left).toBe(COLLAPSED_LEFT / 2)
    expect(style.top).toBe((800 - COLLAPSED_BOTTOM - PLAYER_SIZES.miniPlayerHeight) / 2)
    expect(style.width).toBe(400 - COLLAPSED_LEFT)
    expect(style.borderTopLeftRadius).toBe(PILL_RADIUS / 2)
  })

  test('interpolates upward from the expanded pill when expanding', () => {
    const style = geometry(0, 0.5)

    expect(style.bottom).toBe(EXPANDED_BOTTOM / 2)
    expect(style.left).toBe(BAR_SIDE_INSET / 2)
    expect(style.top).toBe((800 - EXPANDED_BOTTOM - PLAYER_SIZES.miniPlayerHeight) / 2)
    expect(style.width).toBe(400 - BAR_SIDE_INSET)
    expect(style.borderTopLeftRadius).toBe(PILL_RADIUS / 2)
  })

  test('reaches fullscreen regardless of the resting bar state', () => {
    const expected = {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      bottom: 0,
      left: 0,
      top: 0,
      width: 400,
    }

    expect(geometry(0, 1)).toEqual(expected)
    expect(geometry(1, 1)).toEqual(expected)
  })
})
