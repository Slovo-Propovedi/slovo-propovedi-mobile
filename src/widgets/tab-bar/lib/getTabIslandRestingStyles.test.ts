import {
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  WIDE_TAB_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { getTabIslandRestingStyles } from './getTabIslandRestingStyles'

const EXPANDED_WIDTH = 584

const getStyles = (
  settledIsCollapsed: boolean,
  settledFocused = false,
  settledOneLine = false,
  isWideLayout = false,
) =>
  getTabIslandRestingStyles({
    expandedWidth: EXPANDED_WIDTH,
    isWideLayout,
    settledFocused,
    settledIsCollapsed,
    settledOneLine,
  })

describe('getTabIslandRestingStyles', () => {
  test('the expanded bar rests at the full row width and content inset', () => {
    expect(getStyles(false)).toEqual({
      content: {
        paddingLeft: ISLAND_CONTENT_PADDING_HORIZONTAL,
        paddingRight: ISLAND_CONTENT_PADDING_HORIZONTAL,
      },
      island: {
        height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
        opacity: 1,
        width: EXPANDED_WIDTH,
      },
    })
  })

  test('the one-line bar rests at a 48x48 circle without content padding', () => {
    expect(getStyles(true, false, true)).toEqual({
      content: { paddingLeft: 0, paddingRight: 0 },
      island: {
        height: TAB_BAR_ISLAND_HEIGHT,
        opacity: 1,
        width: TAB_BAR_ISLAND_HEIGHT,
      },
    })
  })

  test('a collapsed shape on the expanded bar rests at a 68x68 circle', () => {
    // A visible search field collapses the shape but keeps the expanded height.
    expect(getStyles(true, false, false)).toEqual({
      content: { paddingLeft: 0, paddingRight: 0 },
      island: {
        height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
        opacity: 1,
        width: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
      },
    })
  })

  test('the focused expanded bar rests invisible and widthless', () => {
    expect(getStyles(false, true)).toEqual({
      content: {
        paddingLeft: ISLAND_CONTENT_PADDING_HORIZONTAL,
        paddingRight: ISLAND_CONTENT_PADDING_HORIZONTAL,
      },
      island: { height: TAB_BAR_ISLAND_HEIGHT_EXPANDED, opacity: 0, width: 0 },
    })
  })

  test('the focused one-line bar rests invisible at the compact height', () => {
    expect(getStyles(true, true, true).island).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT,
      opacity: 0,
      width: 0,
    })
  })

  test('wide: the pinned expanded island rests at the slim wide height', () => {
    expect(getStyles(false, false, false, true).island).toEqual({
      height: WIDE_TAB_ISLAND_HEIGHT,
      opacity: 1,
      width: EXPANDED_WIDTH,
    })
  })
})
