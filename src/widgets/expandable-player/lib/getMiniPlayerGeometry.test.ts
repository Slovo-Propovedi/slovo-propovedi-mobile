import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_PILL_ROW_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
  getColumnSideInset,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  WIDE_MINI_PLAYER_MAX_WIDTH,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

const SCREEN_HEIGHT = 800
const SCREEN_WIDTH = 400

const geometryAt = (tabBarHeight: number, barProgress = 0) =>
  getMiniPlayerGeometry({
    barProgress,
    fullScreenHeight: SCREEN_HEIGHT,
    screenWidth: SCREEN_WIDTH,
    tabBarHeight,
    wideBottomInset: BAR_BOTTOM_INSET_MIN,
  })

// Independent model of the real islands row: a fixed content box whose bottom
// edge sits on the bottom safe-area padding line, with the islands flush
// against it.
const islandTopFromScreenBottom = (paddingBottom: number) =>
  paddingBottom + TAB_BAR_ISLAND_HEIGHT_EXPANDED
const islandBottomFromScreenBottom = (paddingBottom: number) => paddingBottom

describe('getMiniPlayerGeometry', () => {
  test('measured 80dp row with 12dp bottom padding: pill rests one pill-row gap above the 72dp island top', () => {
    const paddingBottom = BAR_BOTTOM_INSET_MIN
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const { bottom } = geometryAt(tabBarHeight)

    // 12 bottom padding (BAR_BOTTOM_INSET_MIN) + 60 expanded island height.
    expect(islandTopFromScreenBottom(paddingBottom)).toBe(72)
    expect(bottom).toBe(tabBarHeight - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP)
    expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_PILL_ROW_GAP)
  })

  test.each([0, BAR_BOTTOM_INSET_MIN, 44])(
    'expanded pill keeps exactly BAR_PILL_ROW_GAP above the island top (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight)

      expect(bottom - islandTopFromScreenBottom(paddingBottom)).toBe(BAR_PILL_ROW_GAP)
    },
  )

  test.each([0, BAR_BOTTOM_INSET_MIN, 44])(
    'collapsed pill keeps its bottom aligned with the islands (bottom padding %i)',
    paddingBottom => {
      const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
      const { bottom } = geometryAt(tabBarHeight, 1)

      expect(bottom).toBe(islandBottomFromScreenBottom(paddingBottom))
    },
  )

  test('settled geometry: the pill floats BAR_PILL_ROW_GAP above the one island and spans the row inner edges', () => {
    const paddingBottom = BAR_BOTTOM_INSET_MIN
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + paddingBottom
    const { bottom, left, width } = geometryAt(tabBarHeight)

    // The compact expanded row is ONE island: the search slot is folded into the
    // tab island, so the island spans the row's whole inner width (the separate
    // circle only appears once the row folds).
    const rowLeft = getColumnSideInset(SCREEN_WIDTH, 0, CONTENT_COLUMN_WIDTH)
    const rowContentWidth =
      Math.min(SCREEN_WIDTH, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2
    const verticalGap = bottom - islandTopFromScreenBottom(paddingBottom)

    // Apple Music reference (Issue #153): the pill floats with a wider vertical
    // gap above the islands row.
    expect(verticalGap).toBe(BAR_PILL_ROW_GAP)

    // The pill spans exactly the row's inner edges, so its left/right insets
    // match the island's.
    expect(left).toBe(rowLeft + BAR_SIDE_INSET_EXPANDED)
    expect(width).toBe(rowContentWidth)
  })

  test('one-line bar: widens the side inset and slips the pill between the circles', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN
    const { left, width } = geometryAt(tabBarHeight, 1)
    const collapsedLeft = BAR_SIDE_INSET_COLLAPSED + BAR_CIRCLE_SIZE + BAR_OUTER_GAP

    expect(left).toBe(collapsedLeft)
    expect(width).toBe(SCREEN_WIDTH - collapsedLeft * 2)
  })

  test('interpolates the bottom between the two resting forms', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN
    const expanded = geometryAt(tabBarHeight, 0)
    const collapsed = geometryAt(tabBarHeight, 1)
    const halfway = geometryAt(tabBarHeight, 0.5)

    expect(halfway.bottom).toBeCloseTo((expanded.bottom + collapsed.bottom) / 2)
    expect(halfway.top).toBe(SCREEN_HEIGHT - halfway.bottom - halfway.height)
  })

  test('keeps the mini height in both bar states: the one-line row does not grow the pill', () => {
    const tabBarHeight = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN

    expect(geometryAt(tabBarHeight, 0).height).toBe(PLAYER_SIZES.miniPlayerHeight)
    expect(geometryAt(tabBarHeight, 1).height).toBe(PLAYER_SIZES.miniPlayerHeight)
    expect(geometryAt(tabBarHeight, 0.5).height).toBe(PLAYER_SIZES.miniPlayerHeight)
    expect(geometryAt(tabBarHeight, 1).radius).toBe(PLAYER_SIZES.miniPlayerHeight / 2)
  })
})

describe('getMiniPlayerGeometry compact position contract', () => {
  test('a rotated 844x390 window keeps the 390 column and centres it live', () => {
    const geometry = getMiniPlayerGeometry({
      barProgress: 0,
      contentWidth: 390,
      fullScreenHeight: 390,
      screenWidth: 844,
      tabBarHeight: BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN,
      wideBottomInset: BAR_BOTTOM_INSET_MIN,
    })

    // (844 - 390) / 2 = 227 live column inset, + BAR_SIDE_INSET_EXPANDED 25.
    expect(geometry.left).toBe(252)
    expect(geometry.width).toBe(340)
  })
})

describe('getMiniPlayerGeometry wide layout', () => {
  // The wide pill's bottom inset comes from the chrome's bottom padding
  // (`useBarBottomPadding`): the real safe-area line on a tablet, the desktop-web
  // floor or the iOS-web islands gap — never a platform switch.
  const IPAD_BOTTOM_INSET = 20
  const DESKTOP_WEB_FLOOR = 25

  const wideGeometryAt = ({
    barProgress = 0,
    screenWidth,
    tabBarHeight,
    wideBottomInset = IPAD_BOTTOM_INSET,
  }: {
    barProgress?: number
    screenWidth: number
    tabBarHeight: number
    wideBottomInset?: number
  }) =>
    getMiniPlayerGeometry({
      barProgress,
      fullScreenHeight: SCREEN_HEIGHT,
      isWideLayout: true,
      screenWidth,
      tabBarHeight,
      wideBottomInset,
    })

  // The wide pill has its own wider cap than the content column: it is a
  // standalone bottom chrome, so it may exceed the 550pt island line while
  // staying centered on the screen.
  const pillInset = (screenWidth: number) =>
    Math.max(BAR_SIDE_INSET_EXPANDED, (screenWidth - WIDE_MINI_PLAYER_MAX_WIDTH) / 2)
  const pillWidth = (screenWidth: number) =>
    Math.min(WIDE_MINI_PLAYER_MAX_WIDTH, screenWidth - BAR_SIDE_INSET_EXPANDED * 2)

  test.each([768, 1194])('spans the pill max width at %ipx', screenWidth => {
    const { left, width } = wideGeometryAt({ screenWidth, tabBarHeight: 98 })

    expect(left).toBe(pillInset(screenWidth))
    expect(width).toBe(pillWidth(screenWidth))
  })

  test('caps the pill at 650pt from a 768pt window up', () => {
    expect(WIDE_MINI_PLAYER_MAX_WIDTH).toBe(650)
    expect(wideGeometryAt({ screenWidth: 768, tabBarHeight: 98 }).width).toBe(650)
    expect(wideGeometryAt({ screenWidth: 1194, tabBarHeight: 98 }).width).toBe(650)
  })

  test.each([IPAD_BOTTOM_INSET, DESKTOP_WEB_FLOOR])(
    'rests exactly on the bottom inset the chrome supplies (%i)',
    wideBottomInset => {
      const { bottom, top } = wideGeometryAt({
        screenWidth: 768,
        tabBarHeight: 98,
        wideBottomInset,
      })

      expect(bottom).toBe(wideBottomInset)
      expect(top).toBe(SCREEN_HEIGHT - wideBottomInset - PLAYER_SIZES.wideMiniPlayerHeight)
    },
  )

  test('ignores the tab row height: the pill rests on the chrome bottom inset', () => {
    // The tab island lives at the TOP in the wide layout, so any measured row
    // height is irrelevant — even an absurd one.
    const { bottom } = wideGeometryAt({ screenWidth: 768, tabBarHeight: 5000 })

    expect(bottom).toBe(IPAD_BOTTOM_INSET)
  })

  test('forces the expanded pose: the one-line progress cannot fold the pill', () => {
    const expanded = wideGeometryAt({ screenWidth: 1194, tabBarHeight: 98 })
    const folded = wideGeometryAt({ barProgress: 1, screenWidth: 1194, tabBarHeight: 98 })

    expect(folded).toEqual(expanded)
  })

  test('keeps the wide mini height and the tall pill radius', () => {
    const { height, radius } = wideGeometryAt({ screenWidth: 768, tabBarHeight: 98 })

    // The wide pill is the only bottom chrome: it is taller than the compact
    // 48dp one-line pill so it balances the slimmer 48dp top island.
    expect(PLAYER_SIZES.wideMiniPlayerHeight).toBe(64)
    expect(height).toBe(PLAYER_SIZES.wideMiniPlayerHeight)
    expect(radius).toBe(PLAYER_SIZES.wideMiniPlayerHeight / 2)
  })
})
