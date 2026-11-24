import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { getSearchIslandGeometry } from './getSearchIslandGeometry'

const TAB_BAR_HEIGHT = BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN
const PHONE_WIDTH = 400
// 400 - two side insets: the row's inner width in each bar state.
const EXPANDED_ROW_WIDTH = PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED * 2
const COLLAPSED_ROW_WIDTH = PHONE_WIDTH - BAR_SIDE_INSET_COLLAPSED * 2
const OPEN_TAB_SLOT = TAB_BAR_ISLAND_HEIGHT_EXPANDED + BAR_OUTER_GAP
// The ✕ is the field's full height (60) while open, so the pill yields that
// diameter plus the constant outer gap.
const CLOSE_SLOT = TAB_BAR_ISLAND_HEIGHT_EXPANDED + BAR_OUTER_GAP

const geometry = (input: {
  closeProgress?: number
  focusProgress?: number
  oneLineProgress?: number
  openProgress: number
  screenWidth?: number
}) =>
  getSearchIslandGeometry({
    closeProgress: input.closeProgress,
    focusProgress: input.focusProgress,
    oneLineProgress: input.oneLineProgress ?? 1,
    openProgress: input.openProgress,
    screenWidth: input.screenWidth ?? PHONE_WIDTH,
    tabBarHeight: TAB_BAR_HEIGHT,
  })

describe('getSearchIslandGeometry', () => {
  test('openProgress 0 rests exactly on the search circle', () => {
    const collapsed = geometry({ openProgress: 0 })

    // Right-anchored on the search chip's spot: the pill is a click-equivalent
    // circle before it grows, so the first visible frame never spans the row.
    expect(collapsed.left).toBe(PHONE_WIDTH - BAR_SIDE_INSET_COLLAPSED - BAR_CIRCLE_SIZE)
    expect(collapsed.width).toBe(BAR_CIRCLE_SIZE)
    expect(collapsed.left + collapsed.width).toBe(PHONE_WIDTH - BAR_SIDE_INSET_COLLAPSED)
    expect(collapsed.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(collapsed.radius).toBe(TAB_BAR_ISLAND_HEIGHT / 2)
    expect(collapsed.bottom).toBe(TAB_BAR_HEIGHT - BAR_ROW_MIN_HEIGHT)
    expect(collapsed.closeRight).toBe(BAR_SIDE_INSET_COLLAPSED)
  })

  test('one-line morph widens the outer inset of the closed circle', () => {
    const expanded = geometry({ oneLineProgress: 0, openProgress: 0 })
    const halfway = geometry({ oneLineProgress: 0.5, openProgress: 0 })
    const collapsed = geometry({ oneLineProgress: 1, openProgress: 0 })

    expect(expanded.left + expanded.width).toBe(PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED)
    expect(expanded.closeRight).toBe(BAR_SIDE_INSET_EXPANDED)
    expect(halfway.closeRight).toBe((BAR_SIDE_INSET_EXPANDED + BAR_SIDE_INSET_COLLAPSED) / 2)
    expect(collapsed.closeRight).toBe(BAR_SIDE_INSET_COLLAPSED)
  })

  test('openProgress 1 fills the slot right of the 60 active-tab circle', () => {
    // An open field always sits on the expanded inset (the bar is expanded or
    // the mini pill is detached above the row).
    const open = geometry({ oneLineProgress: 0, openProgress: 1 })

    expect(open.left).toBe(BAR_SIDE_INSET_EXPANDED + OPEN_TAB_SLOT)
    expect(open.width).toBe(EXPANDED_ROW_WIDTH - OPEN_TAB_SLOT)
    expect(open.left + open.width).toBe(PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED)
    // An open field is always the tab bar's full height.
    expect(open.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
  })

  test('interpolates left and width together, keeping the right edge anchored', () => {
    const halfway = geometry({ openProgress: 0.5 })
    const collapsed = geometry({ openProgress: 0 })
    const open = geometry({ openProgress: 1 })

    expect(halfway.left).toBe((collapsed.left + open.left) / 2)
    expect(halfway.width).toBe((collapsed.width + open.width) / 2)
    expect(halfway.left + halfway.width).toBe(open.left + open.width)
  })

  test('left decreases monotonically as the pill opens (no reversed growth)', () => {
    const frames = [0, 0.25, 0.5, 0.75, 1].map(openProgress => geometry({ openProgress }))

    for (let i = 1; i < frames.length; i++) expect(frames[i].left).toBeLessThan(frames[i - 1].left)
  })

  test('collapsed pill matches the search chip diameter in either bar state', () => {
    const expandedBar = geometry({ oneLineProgress: 0, openProgress: 0 })

    // The search chip is 60 while the bar is expanded; a 48-wide pill would
    // leave a visible oval "last frame" instead of a circle.
    expect(expandedBar.width).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
    expect(expandedBar.left).toBe(
      PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED - TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    )
  })

  test('open field keeps the expanded height in every bar state', () => {
    const expandedBar = geometry({ oneLineProgress: 0, openProgress: 1 })
    const halfwayBar = geometry({ oneLineProgress: 0.5, openProgress: 1 })
    const collapsedBar = geometry({ oneLineProgress: 1, openProgress: 1 })

    // Opening the field must never shrink it with the forced-collapsed shape.
    expect(expandedBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
    expect(expandedBar.bottom).toBe(TAB_BAR_HEIGHT - BAR_ROW_MIN_HEIGHT)
    expect(halfwayBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(collapsedBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(collapsedBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
  })

  test('closed circle follows the one-line height axis', () => {
    const expandedBar = geometry({ oneLineProgress: 0, openProgress: 0 })
    const oneLineBar = geometry({ oneLineProgress: 1, openProgress: 0 })

    expect(expandedBar.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(expandedBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED / 2)
    expect(oneLineBar.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(oneLineBar.radius).toBe(TAB_BAR_ISLAND_HEIGHT / 2)
  })

  test('opening from the one-line bar grows the field from 48 to 60', () => {
    const closed = geometry({ oneLineProgress: 1, openProgress: 0 })
    const halfway = geometry({ oneLineProgress: 1, openProgress: 0.5 })
    const open = geometry({ oneLineProgress: 1, openProgress: 1 })

    expect(closed.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(halfway.height).toBe((TAB_BAR_ISLAND_HEIGHT + TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 2)
    expect(halfway.radius).toBe((TAB_BAR_ISLAND_HEIGHT + TAB_BAR_ISLAND_HEIGHT_EXPANDED) / 4)
    expect(open.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
  })

  test('activation from the expanded bar never dips below 60', () => {
    // The height is bound to the one-line axis, not the island's shape axis:
    // opening search collapses the island shape but must not shrink the chip to
    // the compact size, or the unfold reads as starting from the small button.
    const frames = [0, 0.25, 0.5, 0.75, 1].map(openProgress =>
      geometry({ oneLineProgress: 0, openProgress }),
    )

    for (const frame of frames) expect(frame.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)

    // The 60 circle still grows monotonically into the full slot.
    for (let i = 1; i < frames.length; i++)
      expect(frames[i].width).toBeGreaterThan(frames[i - 1].width)
  })

  test('clamps open and one-line progress outside the 0..1 range', () => {
    const below = geometry({ openProgress: -2 })
    const above = geometry({ openProgress: 2 })
    const belowOneLine = geometry({ oneLineProgress: -2, openProgress: 0 })
    const aboveOneLine = geometry({ oneLineProgress: 2, openProgress: 0 })

    expect(below).toEqual(geometry({ openProgress: 0 }))
    expect(above).toEqual(geometry({ openProgress: 1 }))
    expect(belowOneLine.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(aboveOneLine.height).toBe(TAB_BAR_ISLAND_HEIGHT)
  })

  test('reserves the close-circle slot only while the pill is open', () => {
    const open = geometry({ closeProgress: 1, oneLineProgress: 0, openProgress: 1 })
    const closed = geometry({ closeProgress: 1, openProgress: 0 })

    expect(open.left).toBe(BAR_SIDE_INSET_EXPANDED + OPEN_TAB_SLOT)
    expect(open.width).toBe(EXPANDED_ROW_WIDTH - OPEN_TAB_SLOT - CLOSE_SLOT)
    expect(closed.width).toBe(BAR_CIRCLE_SIZE)
    expect(closed.left).toBe(PHONE_WIDTH - BAR_SIDE_INSET_COLLAPSED - BAR_CIRCLE_SIZE)
  })

  test('leaves the constant outer gap between the pill and the focused close circle', () => {
    const focused = geometry({
      closeProgress: 1,
      focusProgress: 1,
      oneLineProgress: 0,
      openProgress: 1,
    })
    const closeCircleLeft = PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED - focused.height

    // The ✕ diameter is the open field height (60), and the pill yields the
    // same circle + gap: 8px of clear space, never an overlap.
    expect(focused.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(focused.left + focused.width).toBe(closeCircleLeft - BAR_OUTER_GAP)
    expect(closeCircleLeft - (focused.left + focused.width)).toBe(BAR_OUTER_GAP)
  })

  test('leaves the same outer gap while the unfocused field stays open', () => {
    const open = geometry({ closeProgress: 1, oneLineProgress: 0, openProgress: 1 })
    const closeCircleLeft = PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED - open.height

    expect(open.left).toBe(BAR_SIDE_INSET_EXPANDED + OPEN_TAB_SLOT)
    expect(open.left + open.width).toBe(closeCircleLeft - BAR_OUTER_GAP)
  })

  test('animates the reserved close slot with closeProgress', () => {
    const halfway = geometry({ closeProgress: 0.5, oneLineProgress: 0, openProgress: 1 })

    expect(halfway.width).toBe(EXPANDED_ROW_WIDTH - OPEN_TAB_SLOT - CLOSE_SLOT / 2)
  })

  test('centers the always-mounted magnifier in the collapsed circle', () => {
    const expandedBar = geometry({ oneLineProgress: 0, openProgress: 0 })
    const collapsedBar = geometry({ oneLineProgress: 1, openProgress: 0 })

    // The closed shape is the search circle: its diameter follows the one-line
    // axis, and the icon must sit in its centre in both resting sizes.
    expect(expandedBar.iconSize).toBe(32)
    expect(expandedBar.iconInset).toBe((TAB_BAR_ISLAND_HEIGHT_EXPANDED - 32) / 2)
    expect(collapsedBar.iconSize).toBe(32)
    expect(collapsedBar.iconInset).toBe((TAB_BAR_ISLAND_HEIGHT - 32) / 2)
  })

  test('keeps the magnifier at a constant size while it travels with the pill edge', () => {
    const circle = geometry({ oneLineProgress: 1, openProgress: 0 })
    const half = geometry({ oneLineProgress: 1, openProgress: 0.5 })
    const pill = geometry({ oneLineProgress: 1, openProgress: 1 })

    expect(circle.iconSize).toBe(32)
    expect(half.iconSize).toBe(32)
    expect(pill.iconSize).toBe(32)
    expect(pill.iconInset).toBe(8)
  })

  test('focus retracts the active-tab circle and stretches the pill to the left inner edge', () => {
    const focused = geometry({ focusProgress: 1, oneLineProgress: 0, openProgress: 1 })

    expect(focused.left).toBe(BAR_SIDE_INSET_EXPANDED)
    expect(focused.width).toBe(EXPANDED_ROW_WIDTH)
    expect(focused.left + focused.width).toBe(PHONE_WIDTH - BAR_SIDE_INSET_EXPANDED)
  })

  test('focus keeps the external close slot free while the pill fills the rest', () => {
    const focused = geometry({
      closeProgress: 1,
      focusProgress: 1,
      oneLineProgress: 0,
      openProgress: 1,
    })

    expect(focused.width).toBe(EXPANDED_ROW_WIDTH - CLOSE_SLOT)
  })

  test('centers the capped column on wide screens', () => {
    const collapsed = geometry({ openProgress: 0, screenWidth: 800 })
    const open = geometry({ oneLineProgress: 0, openProgress: 1, screenWidth: 800 })

    // (800 - 600) / 2 = 100px centered column inset.
    expect(collapsed.left).toBe(800 - (100 + BAR_SIDE_INSET_COLLAPSED) - BAR_CIRCLE_SIZE)
    expect(collapsed.width).toBe(BAR_CIRCLE_SIZE)
    expect(open.left).toBe(100 + BAR_SIDE_INSET_EXPANDED + OPEN_TAB_SLOT)
    expect(open.width).toBe(600 - BAR_SIDE_INSET_EXPANDED * 2 - OPEN_TAB_SLOT)
  })

  test('one-line bar keeps the open pill on the expanded inset', () => {
    // A visible field detaches the mini pill, so even with the bar collapsed
    // the open pill uses the expanded inset, never the wider one-line inset.
    const open = geometry({ oneLineProgress: 0, openProgress: 1 })

    expect(open.width).toBe(EXPANDED_ROW_WIDTH - OPEN_TAB_SLOT)
    expect(COLLAPSED_ROW_WIDTH).toBeLessThan(EXPANDED_ROW_WIDTH)
  })
})
