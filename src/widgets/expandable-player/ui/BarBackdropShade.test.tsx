import { createCtx } from '@reatom/framework'
import { act, screen } from '@testing-library/react-native'
import { type ReactElement } from 'react'
import { StyleSheet } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import {
  searchCloseMorphDriver,
  searchFocusMorphDriver,
  searchOpenMorphDriver,
} from 'widgets/search-island/@x/morphDrivers'
import { tabIslandMorphDriver } from 'widgets/tab-bar/@x/morph'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
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
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { PLAYER_SIZES, themeModeAtom } from 'shared/ui/theme'
import { type ShadeHoleKey } from '../lib/getShadeHoles'
import { barMorphProgressSv, resetBarMorphDriver } from '../model/barMorphDriver'
import { miniPillOpacitySv } from '../model/miniPillFade'
import { type ShadeMorphSources } from '../model/useShadeGeometry'
import { BarBackdropShade } from './BarBackdropShade'

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

const SVG_TEST_ID = 'bar-backdrop-shade-svg'
// The svg `id` reaches the host node as `name` (react-native-svg renames it).
const GRADIENT_NAME = 'bottom-chrome-shade-gradient'
const MASK_NAME = 'bottom-chrome-shade-holes'

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
const LIGHT_SHADE_OPAQUE = 'rgba(0, 0, 0, 0.12)'
const LIGHT_SHADE_COLORS = ['rgba(0, 0, 0, 0)', LIGHT_SHADE_OPAQUE, LIGHT_SHADE_OPAQUE]
const DARK_SHADE_OPAQUE = 'rgba(255, 255, 255, 0.12)'
const DARK_SHADE_COLORS = ['rgba(255, 255, 255, 0)', DARK_SHADE_OPAQUE, DARK_SHADE_OPAQUE]
// One continuous gradient: transparent at the shade top, opaque from the pill's
// midline down. The middle stop is the fixed ramp height over the settled shade
// height — no cap/fill junction to seam on some panels.
const CAP_HEIGHT = SHADE_TOP_OVERSCAN_PX + PLAYER_SIZES.miniPlayerHeight / 2
const EXPANDED_LOCATIONS = [0, CAP_HEIGHT / EXPANDED_HEIGHT, 1]
const COLLAPSED_LOCATIONS = [0, CAP_HEIGHT / COLLAPSED_HEIGHT, 1]
const NO_PILL_EXPANDED_LOCATIONS = [0, CAP_HEIGHT / NO_PILL_EXPANDED_HEIGHT, 1]
const NO_PILL_COLLAPSED_LOCATIONS = [0, CAP_HEIGHT / NO_PILL_COLLAPSED_HEIGHT, 1]
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

interface MaskChildProps extends SvgRectProps {
  slot?: ShadeHoleKey
  sources?: ShadeMorphSources
}

interface SvgRectProps {
  fill?: string
  height?: number | string
  rx?: number
  width?: number | string
  x?: number
  y?: number
}

interface SvgStopProps {
  offset: number
  stopColor: string
}

const findGradientStops = (): Array<ReactElement<SvgStopProps>> =>
  screen.root?.queryAll(instance => instance.props.name === GRADIENT_NAME)[0]?.props.children ?? []

const stopColors = () => findGradientStops().map(stop => stop.props.stopColor)
const stopOffsets = () => findGradientStops().map(stop => stop.props.offset)

// The svg host nests the mapped hole rects as a child array, so flatten it.
const maskChildren = (): Array<ReactElement<MaskChildProps>> => {
  const children = screen.root?.queryAll(instance => instance.props.name === MASK_NAME)[0]?.props
    .children

  if (!Array.isArray(children)) return []

  return children.flatMap(child => (Array.isArray(child) ? child : [child]))
}

const findMaskHoles = () =>
  maskChildren().flatMap(node => (node.props.slot ? [node.props.slot] : []))

// The rendered hole rects in SHADE_HOLE_KEYS order; the white base rect has no
// opacity. `opacity` is the mask strength: 1 cuts the glass footprint out, 0
// paints nothing.
const findHoleRects = () =>
  screen.root?.queryAll(instance => instance.props.opacity !== undefined) ?? []

// The pass-through full-screen layer: absolute inset 0, no height, no svg.
const findLayer = () =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return (
      instance.props.pointerEvents === 'none' &&
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
  hasSearch = true,
  isDark = false,
  measured = true,
}: {
  audio?: AudioPlayerData | null
  expanded?: boolean
  hasMiniPlayer?: boolean
  hasSearch?: boolean
  isDark?: boolean
  measured?: boolean
} = {}) => {
  const ctx = createCtx()
  currentAudioAtom(ctx, audio)
  isPlayerExpandedAtom(ctx, expanded)
  if (measured) setTabBarHeight(ctx, TAB_BAR_HEIGHT)

  const result = await renderWithProviders(
    <BarBackdropShade hasSearch={hasSearch} hasMiniPlayer={hasMiniPlayer} />,
    { ctx },
  )

  if (isDark)
    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })

  return { ...result, ctx }
}

describe('<BarBackdropShade>', () => {
  beforeEach(() => {
    resetBarMorphDriver()
    tabIslandMorphDriver.reset()
    searchOpenMorphDriver.reset()
    searchFocusMorphDriver.reset()
    searchCloseMorphDriver.reset()
    miniPillOpacitySv.value = 1
    keyboardBottomInsetSv.value = 0
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(completeTimingImmediately)
  })

  test('paints one continuous gradient from the screen bottom to the detached pill top', async () => {
    await renderShade()

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      bottom: 0,
      height: EXPANDED_HEIGHT,
      left: 0,
      right: 0,
    })
    // Percent sizing keeps the svg stretched over the morphing shade box.
    expect(screen.getByTestId(SVG_TEST_ID).props).toMatchObject({
      height: '100%',
      width: '100%',
    })
    expect(stopColors()).toEqual(LIGHT_SHADE_COLORS)
    // A single layer spans the whole shade: transparent at the top, opaque from
    // the pill's vertical middle down — there is no cap/fill junction left.
    expect(stopOffsets()).toEqual(EXPANDED_LOCATIONS)
  })

  test('swaps to a same-shape white gradient in the dark theme', async () => {
    await renderShade({ isDark: true })

    expect(stopColors()).toEqual(DARK_SHADE_COLORS)
    expect(stopOffsets()).toEqual(EXPANDED_LOCATIONS)
  })

  test('cuts the settled chrome shapes out of the shade with a mask', async () => {
    await renderShade()

    // White base paints the gradient everywhere except under the islands.
    expect(maskChildren()[0]?.props).toMatchObject({
      fill: 'white',
      height: '100%',
      width: '100%',
    })
    // Four FIXED animated slots: island, search frame, close circle and pill.
    // The slots never unmount, so a morph can never remount a mask node. Their
    // per-frame geometry is unit-tested in getShadeHoles.test.ts.
    expect(findMaskHoles()).toEqual(['island', 'search', 'close', 'pill'])
    // Every slot reads the SAME shared value instances as the glass surfaces.
    maskChildren()
      .filter(node => node.props.slot)
      .forEach(node => {
        const { sources } = node.props

        if (!sources) throw new Error('Animated shade slot has no morph sources')

        expect(sources.closeProgress).toBe(searchCloseMorphDriver.progress)
        expect(sources.focusProgress).toBe(searchFocusMorphDriver.progress)
        expect(sources.islandProgress).toBe(tabIslandMorphDriver.progress)
        expect(sources.openProgress).toBe(searchOpenMorphDriver.progress)
        expect(sources.pillOpacity).toBe(miniPillOpacitySv)
        expect(sources.pillProgress).toBe(barMorphProgressSv)
      })
    const painted = screen.root?.queryAll(instance => instance.props.mask === MASK_NAME)[0]

    expect(painted?.props.fill).toMatchObject({ brushRef: GRADIENT_NAME })
  })

  test('fades the pill cutout with the mini-pill fade', async () => {
    miniPillOpacitySv.value = 0.35
    const { rerender } = await renderShade()

    // Slots render in SHADE_HOLE_KEYS order (island, search, close, pill); the
    // close circle is absent here, so only the pill strength follows the fade.
    expect(findHoleRects().map(rect => rect.props.opacity)).toEqual([1, 1, 0, 0.35])

    miniPillOpacitySv.value = 0
    await rerender(<BarBackdropShade hasSearch hasMiniPlayer />)

    // Fully faded glass leaves no cutout: the gradient closes behind it.
    expect(findHoleRects().map(rect => rect.props.opacity)).toEqual([1, 1, 0, 0])
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
    await rerender(<BarBackdropShade hasSearch hasMiniPlayer />)

    // The floating container already lifts; lifting here too would double-shift
    // the shade away from the pill.
    expect(StyleSheet.flatten(findShade()?.props.style)?.transform).toBeUndefined()
  })

  test('tracks the collapsed pill geometry', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await rerender(<BarBackdropShade hasSearch hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: COLLAPSED_HEIGHT,
    })
    // The middle stop is recomputed for the settled collapsed height, so the
    // ramp still ends exactly on the pill's midline.
    expect(stopOffsets()).toEqual(COLLAPSED_LOCATIONS)
  })

  test('retracts to the islands row while the search field is focused and grows back on blur', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })
    await rerender(<BarBackdropShade hasSearch hasMiniPlayer />)

    // The pill tucks under the row, so the shade's top follows it down to the
    // search pill + close row instead of keeping the pill-extended extent.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })
    expect(stopOffsets()).toEqual(NO_PILL_EXPANDED_LOCATIONS)

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, false)
    })
    await rerender(<BarBackdropShade hasSearch hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: EXPANDED_HEIGHT,
    })
    expect(stopOffsets()).toEqual(EXPANDED_LOCATIONS)
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
    expect(stopColors()).toEqual(LIGHT_SHADE_COLORS)
    expect(stopOffsets()).toEqual(NO_PILL_EXPANDED_LOCATIONS)
  })

  test('anchors to the islands row top when audio exists but no mini player mounts', async () => {
    await renderShade({ hasMiniPlayer: false })

    // The admin zone has no mini-player pill: anchoring to its phantom position
    // would stretch the shade far above the tab bar.
    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_EXPANDED_HEIGHT,
    })
    expect(stopOffsets()).toEqual(NO_PILL_EXPANDED_LOCATIONS)
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
    await rerender(<BarBackdropShade hasSearch hasMiniPlayer />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: NO_PILL_COLLAPSED_HEIGHT,
    })
    expect(stopOffsets()).toEqual(NO_PILL_COLLAPSED_LOCATIONS)
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
