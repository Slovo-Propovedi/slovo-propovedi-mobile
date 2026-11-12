import { LightTheme } from 'shared/ui/theme'
import { createCommonStyles, miniLayerStyle } from './commonStyles'

describe('player layers draw order', () => {
  test('mini pill layer carries no elevation', () => {
    // Android reorders elevation only within sibling groups, so an elevated pill
    // could never lift the player subtree above the tab-bar subtree anyway.
    expect(miniLayerStyle).not.toHaveProperty('elevation')
  })

  test('recovery overlay draws above the tab-bar chrome via zIndex', () => {
    // The player subtree root is a sibling of the Tabs subtree, so only its own
    // zIndex can reorder it above the bar chrome (zIndex 10).
    expect(createCommonStyles(LightTheme).recoveryOverlay).toHaveProperty('zIndex', 20)
  })

  test('the tucked overlay drops below the tab-bar chrome', () => {
    // While the mini pill slides under the islands the player subtree must lose
    // to the tab bar (zIndex 10) so the search pill and ✕ cover it.
    expect(createCommonStyles(LightTheme).recoveryOverlayTucked).toHaveProperty('zIndex', 9)
    expect(createCommonStyles(LightTheme).recoveryOverlayTucked.zIndex).toBeLessThan(10)
  })

  test('recovery overlay carries no elevation', () => {
    // Elevation here cannot reorder against the Tabs subtree (different sibling
    // group) and re-projects the player subtree; keep it off.
    expect(createCommonStyles(LightTheme).recoveryOverlay).not.toHaveProperty('elevation')
  })
})
