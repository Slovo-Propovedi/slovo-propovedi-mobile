import { miniLayerStyle } from './commonStyles'

describe('mini pill layer draw order', () => {
  test('sits above the elevated tab-bar container on Android', () => {
    // The native draw-order contract itself is not jest-testable: the style
    // value IS the contract. The tab-bar container carries elevation 12, so its
    // first child (BarBackdropShade) would composite over the pill's frost
    // without a higher layer here.
    expect(miniLayerStyle.elevation).toBe(13)
  })
})
