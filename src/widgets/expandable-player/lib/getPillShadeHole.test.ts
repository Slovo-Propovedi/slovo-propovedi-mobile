import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry, MINI_PILL_TUCK_DISTANCE } from './getMiniPlayerGeometry'
import { getPillShadeHole } from './getPillShadeHole'
import { EMPTY_SHADE_HOLE, type ShadeRow } from './shadeRow'

const SCREEN_WIDTH = 400
const TAB_BAR_HEIGHT = 98
const FULL_SCREEN_HEIGHT = 800
const SHADE_HEIGHT = 300
const PILL_HEIGHT = PLAYER_SIZES.miniPlayerHeight

// The helper only anchors to the shade box top; the rest of the row is unused.
const ROW: ShadeRow = {
  bottom: 0,
  height: 0,
  innerLeft: 0,
  innerWidth: 0,
  shadeHeight: SHADE_HEIGHT,
}

const SWEEP = [0, 0.25, 0.5, 0.75, 1]

const pillAt = (pillProgress: number) =>
  getMiniPlayerGeometry({
    barProgress: pillProgress,
    fullScreenHeight: FULL_SCREEN_HEIGHT,
    screenWidth: SCREEN_WIDTH,
    tabBarHeight: TAB_BAR_HEIGHT,
  })

const holeAt = ({
  focusProgress = 0,
  hasPill = true,
  pillOpacity = 1,
  pillProgress = 1,
}: {
  focusProgress?: number
  hasPill?: boolean
  pillOpacity?: number
  pillProgress?: number
}) =>
  getPillShadeHole(ROW, {
    focusProgress,
    fullScreenHeight: FULL_SCREEN_HEIGHT,
    hasPill,
    pillOpacity,
    pillProgress,
    screenWidth: SCREEN_WIDTH,
    tabBarHeight: TAB_BAR_HEIGHT,
  })

describe('getPillShadeHole', () => {
  test('keeps the full glass height at every focus value', () => {
    // The glass slides under the row without changing height, so a collapsing
    // hole would leave the pill's top strip uncut mid-tuck.
    expect(SWEEP.map(focusProgress => holeAt({ focusProgress }).height)).toEqual(
      SWEEP.map(() => PILL_HEIGHT),
    )
  })

  test('tracks the glass bottom edge through the whole focus tuck', () => {
    const glassBottomInShade = (focusProgress: number) =>
      SHADE_HEIGHT - (pillAt(1).bottom - MINI_PILL_TUCK_DISTANCE * focusProgress)
    const holeBottomInShade = (focusProgress: number) => {
      const hole = holeAt({ focusProgress })

      return hole.y + hole.height
    }

    expect(SWEEP.map(holeBottomInShade)).toEqual(SWEEP.map(glassBottomInShade))
  })

  test('keeps the full rect at full focus instead of collapsing it', () => {
    expect(holeAt({ focusProgress: 1 })).toEqual({
      height: PILL_HEIGHT,
      opacity: 1,
      width: pillAt(1).width,
      x: pillAt(1).left,
      y: SHADE_HEIGHT - (pillAt(1).bottom - MINI_PILL_TUCK_DISTANCE + PILL_HEIGHT),
    })
  })

  test('maps the pill fade onto the rect strength', () => {
    expect(SWEEP.map(pillOpacity => holeAt({ pillOpacity }).opacity)).toEqual(SWEEP)
  })

  test('clamps focus and pill fade to 0..1', () => {
    expect(holeAt({ focusProgress: -1 })).toEqual(holeAt({ focusProgress: 0 }))
    expect(holeAt({ focusProgress: 2 })).toEqual(holeAt({ focusProgress: 1 }))
    expect(holeAt({ pillOpacity: -1 })).toEqual(holeAt({ pillOpacity: 0 }))
    expect(holeAt({ pillOpacity: 2 })).toEqual(holeAt({ pillOpacity: 1 }))
  })

  test('has zero strength but keeps the full rect once the pill has faded', () => {
    const hole = holeAt({ focusProgress: 1, pillOpacity: 0 })

    // Not EMPTY: the slot keeps tracking the glass so the hole fades in place
    // instead of jumping to a zero-size rect mid-animation.
    expect(hole).not.toEqual(EMPTY_SHADE_HOLE)
    expect(hole).toMatchObject({ height: PILL_HEIGHT, opacity: 0 })
  })

  test('sweeps the glass rect through the bar collapse morph', () => {
    expect(SWEEP.map(pillProgress => holeAt({ pillProgress }))).toEqual(
      SWEEP.map(pillProgress => {
        const pill = pillAt(pillProgress)

        return {
          height: PILL_HEIGHT,
          opacity: 1,
          width: pill.width,
          x: pill.left,
          y: SHADE_HEIGHT - (pill.bottom + PILL_HEIGHT),
        }
      }),
    )
  })

  test('cuts nothing without a pill', () => {
    expect(holeAt({ hasPill: false })).toEqual(EMPTY_SHADE_HOLE)
  })
})
