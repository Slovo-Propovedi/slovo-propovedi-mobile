import { LightTheme } from 'shared/ui/theme'
import { createCommonStyles, miniLayerStyle } from './commonStyles'

describe('mini pill layer draw order', () => {
  test('sits above the elevated tab-bar container on Android', () => {
    // The native draw-order contract itself is not jest-testable: the style
    // value IS the contract. The tab-bar container carries elevation 12, so its
    // first child (BarBackdropShade) would composite over the pill's frost
    // without a higher layer here.
    expect(miniLayerStyle.elevation).toBe(13)
  })
})

describe('player subtree draw order', () => {
  test('lifts the whole subtree above the elevated tab-bar container on Android', () => {
    // Android elevation reorders within sibling groups, so the pill layer's own
    // elevation cannot beat the tab-bar's elevated container. The subtree root
    // must carry the higher elevation instead.
    expect(createCommonStyles(LightTheme).recoveryOverlay.elevation).toBe(13)
  })
})
