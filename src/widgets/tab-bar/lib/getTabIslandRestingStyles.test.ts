import {
  BAR_CIRCLE_SIZE,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { getTabIslandRestingStyles } from './getTabIslandRestingStyles'

const EXPANDED_WIDTH = 584

const getStyles = (settledIsCollapsed: boolean, settledFocused = false) =>
  getTabIslandRestingStyles({
    collapsedWidth: BAR_CIRCLE_SIZE,
    expandedWidth: EXPANDED_WIDTH,
    settledFocused,
    settledIsCollapsed,
  })

describe('getTabIslandRestingStyles', () => {
  test('the expanded bar rests at the full row width and content inset', () => {
    expect(getStyles(false)).toEqual({
      content: {
        paddingLeft: ISLAND_CONTENT_PADDING_HORIZONTAL,
        paddingRight: ISLAND_CONTENT_PADDING_HORIZONTAL,
      },
      island: { height: TAB_BAR_ISLAND_HEIGHT_EXPANDED, opacity: 1, width: EXPANDED_WIDTH },
    })
  })

  test('the collapsed bar rests at the circle size without content padding', () => {
    expect(getStyles(true)).toEqual({
      content: { paddingLeft: 0, paddingRight: 0 },
      island: { height: TAB_BAR_ISLAND_HEIGHT, opacity: 1, width: BAR_CIRCLE_SIZE },
    })
  })

  test('the focused bar rests invisible and widthless', () => {
    expect(getStyles(false, true)).toEqual({
      content: {
        paddingLeft: ISLAND_CONTENT_PADDING_HORIZONTAL,
        paddingRight: ISLAND_CONTENT_PADDING_HORIZONTAL,
      },
      island: { height: TAB_BAR_ISLAND_HEIGHT_EXPANDED, opacity: 0, width: 0 },
    })
  })
})
