import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/theme'
import { getRestingContainerStyle } from './getRestingContainerStyle'

describe('getRestingContainerStyle', () => {
  const common = { fullScreenHeight: 800, miniBottom: 52, screenWidth: 400 }

  test('collapsed: returns mini-player geometry', () => {
    const style = getRestingContainerStyle({ expanded: false, ...common })

    expect(style).toEqual({
      borderBottomLeftRadius: RADIUSES.middle,
      borderBottomRightRadius: RADIUSES.middle,
      borderTopLeftRadius: RADIUSES.middle,
      borderTopRightRadius: RADIUSES.middle,
      bottom: 52,
      left: INDENTS.low,
      top: 800 - 52 - PLAYER_SIZES.miniPlayerHeight,
      width: 400 - INDENTS.low * 2,
    })
  })

  test('expanded: returns fullscreen geometry with zero radii', () => {
    const style = getRestingContainerStyle({ expanded: true, ...common })

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
