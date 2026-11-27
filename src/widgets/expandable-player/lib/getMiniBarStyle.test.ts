import {
  BAR_EXPANDED_ISLAND_TOP_MARGIN,
  BAR_PILL_ROW_GAP,
  WIDE_MINI_PLAYER_MAX_WIDTH,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniBarStyle } from './getMiniBarStyle'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

const TAB_BAR_HEIGHT = 98
const WIDE_BOTTOM_INSET = 20
const EXPANDED_BOTTOM = TAB_BAR_HEIGHT - BAR_EXPANDED_ISLAND_TOP_MARGIN + BAR_PILL_ROW_GAP

interface StyleInput {
  contentWidth: number
  isWideLayout?: boolean
  screenWidth: number
}

const styleAt = ({ contentWidth, isWideLayout = false, screenWidth }: StyleInput) =>
  getMiniBarStyle({
    barProgress: 0,
    contentWidth,
    fullScreenHeight: 390,
    isWideLayout,
    screenWidth,
    tabBarHeight: TAB_BAR_HEIGHT,
    wideBottomInset: WIDE_BOTTOM_INSET,
  })

const geometryAt = ({ contentWidth, isWideLayout = false, screenWidth }: StyleInput) =>
  getMiniPlayerGeometry({
    barProgress: 0,
    contentWidth,
    fullScreenHeight: 390,
    isWideLayout,
    screenWidth,
    tabBarHeight: TAB_BAR_HEIGHT,
    wideBottomInset: WIDE_BOTTOM_INSET,
  })

describe('getMiniBarStyle native centering', () => {
  test('a rotated phone keeps the pill on the portrait column without a live-screen offset', () => {
    // The container still needs the screen-relative left (it is a sibling of
    // the centred pill column), so the pure geometry keeps returning it…
    expect(geometryAt({ contentWidth: 390, screenWidth: 844 }).left).toBe(252)
    // …while the pill is placed inside the natively centred column, so only the
    // 25dp inset from the column's inner edge remains.
    const style = styleAt({ contentWidth: 390, screenWidth: 844 })

    expect(style.right).toBe(25)
    expect(style.width).toBe(340)
    expect(style.bottom).toBe(EXPANDED_BOTTOM)
    expect(style.height).toBe(PLAYER_SIZES.miniPlayerHeight)
  })

  test('a phone at rest sits on the column inner edge', () => {
    expect(styleAt({ contentWidth: 400, screenWidth: 400 }).right).toBe(25)
  })

  test('the wide pill rests flush with the native column cap', () => {
    expect(WIDE_MINI_PLAYER_MAX_WIDTH).toBe(650)
    const style = styleAt({ contentWidth: 1194, isWideLayout: true, screenWidth: 1194 })

    expect(style.right).toBe(0)
    expect(style.width).toBe(650)
    expect(style.height).toBe(PLAYER_SIZES.wideMiniPlayerHeight)
  })

  test('no left offset leaks into the pill style', () => {
    expect(styleAt({ contentWidth: 390, screenWidth: 844 })).not.toHaveProperty('left')
  })
})
