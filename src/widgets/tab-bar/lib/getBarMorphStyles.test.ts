import { TAB_BAR_ISLAND_HEIGHT } from 'shared/ui/layout'
import { getIslandContentStyle, getTabItemStyle } from './getBarMorphStyles'

describe('getIslandContentStyle', () => {
  test('expanded content insets the slots with longhand padding', () => {
    expect(getIslandContentStyle(0)).toEqual({ paddingLeft: 10, paddingRight: 10 })
  })

  test('collapsed content drops the inset so the active slot fills the circle', () => {
    expect(getIslandContentStyle(1)).toEqual({ paddingLeft: 0, paddingRight: 0 })
  })

  test('uses longhand padding so the morph reaches the web DOM', () => {
    // Reanimated updates web styles through react-native-web's createReactDOMStyle
    // only; that path skips the preprocess step which expands `paddingHorizontal`.
    // The shortform therefore freezes at its mount value and pushes the collapsed
    // 48dp slot past the circle's right edge.
    expect(getIslandContentStyle(0.5)).not.toHaveProperty('paddingHorizontal')
  })
})

describe('getTabItemStyle', () => {
  test('expanded item splits the neighbour gap on both sides with longhand margins', () => {
    expect(getTabItemStyle(0)).toEqual({
      height: 60,
      marginBottom: 4,
      marginLeft: 4,
      marginRight: 4,
      marginTop: 4,
    })
  })

  test('collapsed item fills the circle with no horizontal margin', () => {
    expect(getTabItemStyle(1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT - 4 * 2,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 4,
    })
  })

  test('height follows the one-line axis while margins follow the shape axis', () => {
    // Search-open: the shape axis is collapsed (A = 1) but the visible field
    // keeps the island at 68. Sizing the item from A leaves it 40 tall inside a
    // 68 slot, resting above the circle centre; the height must read axis D.
    expect(getTabItemStyle(1, 0)).toEqual({
      height: 60,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 4,
    })
    // Compact one-line row: both axes collapsed, item 48 - 8 margins.
    expect(getTabItemStyle(1, 1)).toEqual({
      height: TAB_BAR_ISLAND_HEIGHT - 4 * 2,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 4,
    })
    // Expanded bar: unchanged.
    expect(getTabItemStyle(0, 0)).toEqual({
      height: 60,
      marginBottom: 4,
      marginLeft: 4,
      marginRight: 4,
      marginTop: 4,
    })
  })

  test('uses longhand margins so the morph reaches the web DOM', () => {
    const style = getTabItemStyle(0.5)

    expect(style).not.toHaveProperty('marginHorizontal')
    expect(style).not.toHaveProperty('marginVertical')
  })
})
