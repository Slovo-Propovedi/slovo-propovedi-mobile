import { LightTheme } from 'shared/ui/theme'
import { createCommonStyles, miniLayerStyle } from './commonStyles'

describe('player layers draw order', () => {
  test('mini pill layer carries no elevation', () => {
    // The tab-bar backdrop is flat (its elevation lives on the islands row), so
    // the pill needs no elevation of its own: the document order already paints
    // the player subtree after the tab bar.
    expect(miniLayerStyle).not.toHaveProperty('elevation')
  })

  test('recovery overlay carries no elevation', () => {
    // An elevated wrapper would re-project the player subtree and race the
    // islands row; the flat shade makes that race impossible.
    expect(createCommonStyles(LightTheme).recoveryOverlay).not.toHaveProperty('elevation')
  })
})
