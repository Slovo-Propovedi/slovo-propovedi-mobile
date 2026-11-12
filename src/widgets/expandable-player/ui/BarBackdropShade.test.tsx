import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { Platform, StyleSheet } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import {
  holdSearchFocus,
  isSearchFieldFocusedAtom,
  isSearchOpenAtom,
  releaseSearchFocusHold,
} from 'features/sermon-search/@x/barMorph'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import {
  BOTTOM_CHROME_SHADE_KEY,
  getBlurTarget,
  unregisterBlurTarget,
} from 'shared/ui/glass/blurTargets'
import {
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  keyboardBottomInsetSv,
  setBarCollapsed,
  setTabBarHeight,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { PLAYER_SIZES, themeModeAtom } from 'shared/ui/theme'
import { resetBarMorphDriver } from '../model/barMorphDriver'
import { BarBackdropShade } from './BarBackdropShade'

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('expo-blur', () => {
  const { forwardRef } = jest.requireActual('react')
  const { View: MockView } = jest.requireActual('react-native')

  return {
    BlurTargetView: forwardRef((props: Record<string, unknown>, ref: unknown) => (
      <MockView {...props} ref={ref} testID='shade-blur-target' />
    )),
  }
})

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: 400 }),
}))

// The row's bottom padding is the same device inset the fixture height encodes.
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({ bottom: 14, left: 0, right: 0, top: 0 }),
  }
})

// Fixture row height: BAR_ROW_MIN_HEIGHT content box plus the device safe-area
// padding CustomTabBar adds (mirrors a phone with a 14dp bottom inset).
const TAB_BAR_HEIGHT = 98
const SHADE_TOP_OVERSCAN_PX = 10
// Detached pill sits one outer gap above the expanded island's top edge
// (getMiniPlayerGeometry), and the shade reaches the pill's top plus the
// overscan.
const EXPANDED_HEIGHT =
  TAB_BAR_HEIGHT -
  BAR_EXPANDED_ISLAND_TOP_MARGIN +
  BAR_OUTER_GAP +
  PLAYER_SIZES.miniPlayerHeight +
  SHADE_TOP_OVERSCAN_PX
// Collapsed row: islands are centered in BAR_ROW_MIN_HEIGHT, so the pill's
// bottom sits half the leftover height above the content box's bottom edge.
const COLLAPSED_HEIGHT =
  TAB_BAR_HEIGHT -
  (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2 +
  PLAYER_SIZES.miniPlayerHeight +
  SHADE_TOP_OVERSCAN_PX
// No pill: the shade anchors to the islands row top instead. The row is
// BAR_ROW_MIN_HEIGHT plus the bottom padding, and the island is centered in it,
// so its top gap grows as the island shrinks from the expanded 76 to 64.
const NO_PILL_EXPANDED_HEIGHT =
  TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2 + SHADE_TOP_OVERSCAN_PX
const NO_PILL_COLLAPSED_HEIGHT =
  TAB_BAR_HEIGHT - (BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT) / 2 + SHADE_TOP_OVERSCAN_PX
const LIGHT_SHADE_OPAQUE = 'rgba(0, 0, 0, 0.08)'
const LIGHT_SHADE_COLORS = ['rgba(0, 0, 0, 0)', LIGHT_SHADE_OPAQUE, LIGHT_SHADE_OPAQUE]
const DARK_SHADE_OPAQUE = 'rgba(128, 128, 128, 0.15)'
const DARK_SHADE_COLORS = ['rgba(128, 128, 128, 0)', DARK_SHADE_OPAQUE, DARK_SHADE_OPAQUE]
// One continuous gradient: transparent at the shade top, opaque from the pill's
// midline down. The middle stop is the fixed ramp height over the settled shade
// height — no cap/fill junction to seam on some panels.
const CAP_HEIGHT = SHADE_TOP_OVERSCAN_PX + PLAYER_SIZES.miniPlayerHeight / 2
const EXPANDED_LOCATIONS = [0, CAP_HEIGHT / EXPANDED_HEIGHT, 1]
const COLLAPSED_LOCATIONS = [0, CAP_HEIGHT / COLLAPSED_HEIGHT, 1]
const NO_PILL_EXPANDED_LOCATIONS = [0, CAP_HEIGHT / NO_PILL_EXPANDED_HEIGHT, 1]
const NO_PILL_COLLAPSED_LOCATIONS = [0, CAP_HEIGHT / NO_PILL_COLLAPSED_HEIGHT, 1]
const KEYBOARD_INSET = 320
const SHADE_TARGET_TEST_ID = 'shade-blur-target'

const setPlatform = (os: 'android' | 'ios', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

const layoutShadeTarget = async () => {
  await act(async () => fireEvent(screen.getByTestId(SHADE_TARGET_TEST_ID), 'layout'))
}

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

const findGradient = (colors = LIGHT_SHADE_COLORS) =>
  screen.root?.queryAll(
    instance =>
      Array.isArray(instance.props.colors) && instance.props.colors.join('|') === colors.join('|'),
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
  hasMiniPlayer = true,
  isDark = false,
  measured = true,
  searchOpen = false,
}: {
  audio?: AudioPlayerData | null
  expanded?: boolean
  hasMiniPlayer?: boolean
  isDark?: boolean
  measured?: boolean
  searchOpen?: boolean
} = {}) => {
  const ctx = createCtx()
  currentAudioAtom(ctx, audio)
  isPlayerExpandedAtom(ctx, expanded)
  isSearchOpenAtom(ctx, searchOpen)
  if (measured) setTabBarHeight(ctx, TAB_BAR_HEIGHT)

  const result = await renderWithProviders(<BarBackdropShade hasMiniPlayer={hasMiniPlayer} />, {
    ctx,
  })

  if (isDark)
    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })

  return { ...result, ctx }
}

describe('<BarBackdropShade>', () => {
  beforeEach(() => {
    resetBarMorphDriver()
    keyboardBottomInsetSv.value = 0
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(completeTimingImmediately)
    const shadeTarget = getBlurTarget(BOTTOM_CHROME_SHADE_KEY)

    if (shadeTarget) unregisterBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)

    setPlatform('ios', undefined)
  })

  test('registers a dedicated glass target while the search page is open', async () => {
    setPlatform('android', 35)
    const { ctx } = await renderShade({ searchOpen: true })

    expect(screen.getByTestId(SHADE_TARGET_TEST_ID)).toBeTruthy()
    expect(getBlurTarget(BOTTOM_CHROME_SHADE_KEY)).toBeNull()

    await layoutShadeTarget()

    expect(getBlurTarget(BOTTOM_CHROME_SHADE_KEY)).not.toBeNull()

    await act(async () => {
      isSearchOpenAtom(ctx, false)
    })

    expect(getBlurTarget(BOTTOM_CHROME_SHADE_KEY)).toBeNull()
  })

  test('renders the shade without a target wrapper while the search page is closed', async () => {
    setPlatform('android', 35)

    await renderShade()

    expect(screen.queryByTestId(SHADE_TARGET_TEST_ID)).toBeNull()
  })

  test('paints one continuous gradient from the screen bottom to the detached pill top', async () => {
    await renderShade()
    const gradient = findGradient()

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      bottom: 0,
      height: EXPANDED_HEIGHT,
      left: 0,
      right: 0,
    })
    expect(gradient?.props.colors).toEqual(LIGHT_SHADE_COLORS)
    // A single layer spans the whole shade: transparent at the top, opaque from
    // the pill's vertical middle down — there is no cap/fill junction left.
    expect(gradient?.props.locations).toEqual(EXPANDED_LOCATIONS)
    expect(StyleSheet.flatten(gradient?.props.style)).toMatchObject({
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    })
  })

  test('swaps to a same-shape gray gradient in the dark theme', async () => {
    await renderShade({ isDark: true })
    const gradient = findGradient(DARK_SHADE_COLORS)

    expect(gradient?.props.colors).toEqual(DARK_SHADE_COLORS)
    expect(gradient?.props.locations).toEqual(EXPANDED_LOCATIONS)
    expect(findGradient()).toBeUndefined()
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
    await rerender(<BarBackdropShade hasMiniPlayer />)

    // The floating container already lifts; lifting here too would double-shift
    // the shade away from the pill.
    expect(StyleSheet.flatten(findShade()?.props.style)?.transform).toBeUndefined()
  })

  test('tracks the collapsed pill geometry', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await rerender(<BarBackdropShade hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: COLLAPSED_HEIGHT,
    })
    // The middle stop is recomputed for the settled collapsed height, so the
    // ramp still ends exactly on the pill's midline.
    expect(findGradient()?.props.locations).toEqual(COLLAPSED_LOCATIONS)
  })

  test('retracts to the islands row while the search field is focused and grows back on blur', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })
    await rerender(<BarBackdropShade hasMiniPlayer />)

    // The pill tucks under the row, so the shade's top follows it down to the
    // search pill + close row instead of keeping the pill-extended extent.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })
    expect(findGradient()?.props.locations).toEqual(NO_PILL_EXPANDED_LOCATIONS)

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, false)
    })
    await rerender(<BarBackdropShade hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: EXPANDED_HEIGHT,
    })
    expect(findGradient()?.props.locations).toEqual(EXPANDED_LOCATIONS)
  })

  test('keeps the retracted shade while the focus is held after a blur', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })
    await act(async () => {
      holdSearchFocus(ctx)
    })
    await act(async () => {
      isSearchFieldFocusedAtom(ctx, false)
    })
    await rerender(<BarBackdropShade hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })

    await act(async () => {
      releaseSearchFocusHold(ctx)
    })
    await rerender(<BarBackdropShade hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: EXPANDED_HEIGHT,
    })
  })

  test('anchors to the islands row top while no pill is active', async () => {
    await renderShade({ audio: null })

    // The shade accompanies the visible bottom chrome even without a pill: it
    // reaches the islands row top plus the same overscan ramp.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      bottom: 0,
      height: NO_PILL_EXPANDED_HEIGHT,
      left: 0,
      right: 0,
    })
    expect(findGradient()).toBeDefined()
    expect(findGradient()?.props.locations).toEqual(NO_PILL_EXPANDED_LOCATIONS)
  })

  test('anchors to the islands row top when audio exists but no mini player mounts', async () => {
    await renderShade({ hasMiniPlayer: false })

    // The admin zone has no mini-player pill: anchoring to its phantom position
    // would stretch the shade far above the tab bar.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })
    expect(findGradient()?.props.locations).toEqual(NO_PILL_EXPANDED_LOCATIONS)
  })

  test('ignores fullscreen expansion outside the player zone', async () => {
    await renderShade({ expanded: true, hasMiniPlayer: false })

    // A stale expanded flag from the player zone must not hide the admin shade.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })
  })

  test('follows the bar collapse morph while no pill is active', async () => {
    const { ctx, rerender } = await renderShade({ audio: null })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await rerender(<BarBackdropShade hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_COLLAPSED_HEIGHT,
    })
    expect(findGradient()?.props.locations).toEqual(NO_PILL_COLLAPSED_LOCATIONS)
  })

  test('renders nothing while the player is expanded to fullscreen', async () => {
    await renderShade({ expanded: true })

    expect(findShade()).toBeUndefined()
  })

  test('keeps shading the bar when expanded with no audio', async () => {
    await renderShade({ audio: null, expanded: true })

    // Without audio there is no fullscreen player to hide behind, so the stale
    // expanded flag must not unmount the shade.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })
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
