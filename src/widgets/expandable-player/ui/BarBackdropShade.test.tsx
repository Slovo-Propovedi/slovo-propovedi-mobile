import { createCtx } from '@reatom/framework'
import { act, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import {
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  keyboardBottomInsetSv,
  setBarCollapsed,
  setTabBarHeight,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { BarBackdropShade } from './BarBackdropShade'

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: 400 }),
}))

// Fixture row height: BAR_ROW_MIN_HEIGHT content box plus the device safe-area
// padding CustomTabBar adds (mirrors a phone with a 14dp bottom inset).
const TAB_BAR_HEIGHT = 98
// Detached pill sits one outer gap above the expanded island's top edge
// (getMiniPlayerGeometry), and the shade reaches the pill's top.
const EXPANDED_HEIGHT =
  TAB_BAR_HEIGHT - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_OUTER_GAP + PLAYER_SIZES.miniPlayerHeight
// Collapsed row: islands are centered in BAR_ROW_MIN_HEIGHT, so the pill's
// bottom sits half the leftover height above the content box's bottom edge.
const COLLAPSED_HEIGHT =
  TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2 + PLAYER_SIZES.miniPlayerHeight
const SHADE_COLORS = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.30)']
const SHADE_LOCATIONS = [0, 1]
const KEYBOARD_INSET = 320

// Mirrors the shared reanimated mock: timings complete synchronously. Tests
// that need a mid-morph window override it and restore this afterwards.
const mockedWithTiming = withTiming as jest.Mock
const completeTimingImmediately = (
  toValue: number,
  _config: unknown,
  callback?: (finished: boolean) => void,
) => {
  if (typeof callback === 'function') callback(true)

  return toValue
}

const AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

const findShade = () =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return (
      flat?.position === 'absolute' &&
      flat?.bottom === 0 &&
      flat?.left === 0 &&
      flat?.right === 0 &&
      typeof flat?.height === 'number'
    )
  })[0]

const findGradient = () =>
  screen.root?.queryAll(
    instance =>
      Array.isArray(instance.props.colors) &&
      instance.props.colors.join('|') === SHADE_COLORS.join('|'),
  )[0]

// The pass-through full-screen layer: absolute inset 0, no height, no gradient.
const findLayer = () =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return (
      instance.props.pointerEvents === 'none' &&
      !Array.isArray(instance.props.colors) &&
      flat?.position === 'absolute' &&
      flat?.top === 0 &&
      flat?.bottom === 0 &&
      flat?.left === 0 &&
      flat?.right === 0 &&
      typeof flat?.height !== 'number'
    )
  })[0]

const renderShade = async ({
  audio = AUDIO,
  expanded = false,
  measured = true,
}: {
  audio?: AudioPlayerData | null
  expanded?: boolean
  measured?: boolean
} = {}) => {
  const ctx = createCtx()
  currentAudioAtom(ctx, audio)
  isPlayerExpandedAtom(ctx, expanded)
  if (measured) setTabBarHeight(ctx, TAB_BAR_HEIGHT)

  const result = await renderWithProviders(<BarBackdropShade />, { ctx })

  return { ...result, ctx }
}

describe('<BarBackdropShade>', () => {
  beforeEach(() => {
    keyboardBottomInsetSv.value = 0
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(completeTimingImmediately)
  })

  test('paints one subtle gradient from the screen bottom to the detached pill top', async () => {
    await renderShade()
    const gradient = findGradient()

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      bottom: 0,
      height: EXPANDED_HEIGHT,
      left: 0,
      right: 0,
    })
    expect(gradient?.props.colors).toEqual(SHADE_COLORS)
    expect(gradient?.props.locations).toEqual(SHADE_LOCATIONS)
  })

  test('lets document order inside the tab bar own stacking: no zIndex, never intercepts touches', async () => {
    await renderShade()

    const layer = findLayer()

    expect(layer?.props.pointerEvents).toBe('none')
    // The tab-bar layer already paints above the screens; a zIndex here would
    // sort the shade above its sibling islands instead of behind them.
    expect(StyleSheet.flatten(layer?.props.style)?.zIndex).toBeUndefined()
  })

  test('leaves the keyboard lift to the tab-bar container', async () => {
    const { rerender } = await renderShade()

    keyboardBottomInsetSv.value = KEYBOARD_INSET
    await rerender(<BarBackdropShade />)

    // The floating container already lifts; lifting here too would double-shift
    // the shade away from the pill.
    expect(StyleSheet.flatten(findShade()?.props.style)?.transform).toBeUndefined()
  })

  test('tracks the collapsed pill geometry', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await rerender(<BarBackdropShade />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: COLLAPSED_HEIGHT,
    })
  })

  test('renders nothing while no audio is active', async () => {
    await renderShade({ audio: null })

    expect(findShade()).toBeUndefined()
    expect(findGradient()).toBeUndefined()
  })

  test('renders nothing while the player is expanded to fullscreen', async () => {
    await renderShade({ expanded: true })

    expect(findShade()).toBeUndefined()
  })

  test('keeps the shade visible mid-morph and drops it on settle', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)

      return toValue
    })
    const { ctx } = await renderShade()

    expect(findShade()).toBeDefined()

    await act(async () => {
      isPlayerExpandedAtom(ctx, true)
    })

    // Expanded, but the timing has not landed: unmounting here would pop the
    // shade out from behind the pill on the morph's first frame.
    expect(findShade()).toBeDefined()

    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    expect(findShade()).toBeUndefined()
  })

  test('renders nothing until the tab bar has a measured height', async () => {
    await renderShade({ measured: false })

    expect(findShade()).toBeUndefined()
  })
})
