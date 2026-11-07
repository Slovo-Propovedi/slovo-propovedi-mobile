import { getIslandContentStyle, getTabItemStyle } from './getBarMorphStyles'

describe('getIslandContentStyle', () => {
  test('expanded content insets the slots with longhand padding', () => {
    expect(getIslandContentStyle(0)).toEqual({ paddingLeft: 12, paddingRight: 12 })
  })

  test('collapsed content drops the inset so the active slot fills the circle', () => {
    expect(getIslandContentStyle(1)).toEqual({ paddingLeft: 0, paddingRight: 0 })
  })

  test('uses longhand padding so the morph reaches the web DOM', () => {
    // Reanimated updates web styles through react-native-web's createReactDOMStyle
    // only; that path skips the preprocess step which expands `paddingHorizontal`.
    // The shortform therefore freezes at its mount value and pushes the collapsed
    // 64dp slot past the circle's right edge.
    expect(getIslandContentStyle(0.5)).not.toHaveProperty('paddingHorizontal')
  })
})

describe('getTabItemStyle', () => {
  test('expanded item splits the neighbour gap on both sides with longhand margins', () => {
    expect(getTabItemStyle(0)).toEqual({
      height: 64,
      marginBottom: 6,
      marginLeft: 5,
      marginRight: 5,
      marginTop: 6,
    })
  })

  test('collapsed item fills the circle with no horizontal margin', () => {
    expect(getTabItemStyle(1)).toEqual({
      height: 56,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 4,
    })
  })

  test('uses longhand margins so the morph reaches the web DOM', () => {
    const style = getTabItemStyle(0.5)

    expect(style).not.toHaveProperty('marginHorizontal')
    expect(style).not.toHaveProperty('marginVertical')
  })
})
