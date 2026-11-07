import {
  BAR_CIRCLE_SIZE,
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET,
  CONTENT_COLUMN_WIDTH,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getRestingContainerStyle } from './getRestingContainerStyle'

const PILL_RADIUS = PLAYER_SIZES.miniPlayerHeight / 2
const EXPANDED_BOTTOM = 98 - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_OUTER_GAP
const COLLAPSED_BOTTOM = 98 - (BAR_ROW_MIN_HEIGHT + TAB_BAR_ISLAND_HEIGHT) / 2
const COLLAPSED_SIDE_INSET = BAR_SIDE_INSET + BAR_CIRCLE_SIZE + BAR_OUTER_GAP

describe('getRestingContainerStyle', () => {
  const common = { barCollapsed: false, fullScreenHeight: 800, screenWidth: 400, tabBarHeight: 98 }

  test('expanded bar: returns the detached pill above the tab row', () => {
    const style = getRestingContainerStyle({ expanded: false, ...common })

    expect(style).toEqual({
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

  test('expanded bar: centers the pill on the islands row content in the column', () => {
    const columnInset = (800 - CONTENT_COLUMN_WIDTH) / 2
    const style = getRestingContainerStyle({
      barCollapsed: false,
      expanded: false,
      fullScreenHeight: 800,
      screenWidth: 800,
      tabBarHeight: 98,
    })

    expect(style).toEqual({
      borderBottomLeftRadius: PILL_RADIUS,
      borderBottomRightRadius: PILL_RADIUS,
      borderTopLeftRadius: PILL_RADIUS,
      borderTopRightRadius: PILL_RADIUS,
      bottom: EXPANDED_BOTTOM,
      left: columnInset + BAR_SIDE_INSET,
      top: 800 - EXPANDED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      width: CONTENT_COLUMN_WIDTH - BAR_SIDE_INSET * 2,
    })
  })

  test.each([400, 800])(
    'expanded bar: pill edges equal the islands row content at %ipx',
    screenWidth => {
      const rowLeft = Math.max(0, (screenWidth - CONTENT_COLUMN_WIDTH) / 2)
      const rowContentLeft = rowLeft + BAR_SIDE_INSET
      const rowContentWidth = Math.min(screenWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET * 2
      const style = getRestingContainerStyle({
        barCollapsed: false,
        expanded: false,
        fullScreenHeight: 800,
        screenWidth,
        tabBarHeight: 98,
      })

      expect(style.left).toBe(rowContentLeft)
      expect(style.width).toBe(rowContentWidth)
    },
  )

  test('collapsed bar: sits in the row between the tab circle and the search circle', () => {
    const style = getRestingContainerStyle({ ...common, barCollapsed: true, expanded: false })

    expect(style).toEqual({
      borderBottomLeftRadius: PILL_RADIUS,
      borderBottomRightRadius: PILL_RADIUS,
      borderTopLeftRadius: PILL_RADIUS,
      borderTopRightRadius: PILL_RADIUS,
      bottom: COLLAPSED_BOTTOM,
      left: COLLAPSED_SIDE_INSET,
      top: 800 - COLLAPSED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      width: 400 - COLLAPSED_SIDE_INSET * 2,
    })
  })

  test('collapsed bar: keeps the pill inside the centered column on large screens', () => {
    const columnInset = (800 - CONTENT_COLUMN_WIDTH) / 2
    const style = getRestingContainerStyle({
      barCollapsed: true,
      expanded: false,
      fullScreenHeight: 800,
      screenWidth: 800,
      tabBarHeight: 98,
    })

    expect(style).toEqual({
      borderBottomLeftRadius: PILL_RADIUS,
      borderBottomRightRadius: PILL_RADIUS,
      borderTopLeftRadius: PILL_RADIUS,
      borderTopRightRadius: PILL_RADIUS,
      bottom: COLLAPSED_BOTTOM,
      left: columnInset + COLLAPSED_SIDE_INSET,
      top: 800 - COLLAPSED_BOTTOM - PLAYER_SIZES.miniPlayerHeight,
      width: 800 - (columnInset + COLLAPSED_SIDE_INSET) * 2,
    })
  })

  test('expanded player: returns fullscreen geometry with zero radii regardless of the bar', () => {
    const style = getRestingContainerStyle({ ...common, barCollapsed: true, expanded: true })

    expect(style).toEqual({
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      bottom: 0,
      left: 0,
      top: 0,
      width: 400,
    })
  })
})
