import { getShadeHoles } from './getShadeHoles'

// Fixture: a 400dp phone with a 14dp bottom inset. The tab row is
// BAR_ROW_MIN_HEIGHT (76) plus that inset, so the measured row height is 90.
const SCREEN_WIDTH = 400
const TAB_BAR_HEIGHT = 90
const BOTTOM_PADDING = 14
const FULL_SCREEN_HEIGHT = 800
// The centered content column is wider than the viewport, so its inset is 0;
// the row then pads by BAR_SIDE_INSET (20) on each side.
const ROW_INNER_LEFT = 20
const ROW_INNER_WIDTH = SCREEN_WIDTH - ROW_INNER_LEFT * 2

const LAYOUT = {
  bottomPadding: BOTTOM_PADDING,
  fullScreenHeight: FULL_SCREEN_HEIGHT,
  hasPill: false,
  hasSearch: true,
  screenWidth: SCREEN_WIDTH,
  tabBarHeight: TAB_BAR_HEIGHT,
}

const BASE_FRAME = {
  closeProgress: 0,
  focusProgress: 0,
  islandProgress: 0,
  openProgress: 0,
  pillOpacity: 1,
  pillProgress: 0,
}

const EMPTY_HOLE = { height: 0, opacity: 0, width: 0, x: 0, y: 0 }
const SWEEP = [0, 0.25, 0.5, 0.75, 1]

// Pill progress = bar collapse, island progress = bar collapse OR search
// visible. A plain scroll collapse drives both, so the island sweep flips both
// to keep the shade box and the row at the same settle point.
const scrollFrames = () =>
  SWEEP.map(islandProgress => ({ ...BASE_FRAME, islandProgress, pillProgress: islandProgress }))

describe('getShadeHoles', () => {
  test('sweeps the island hole with the island collapse morph', () => {
    // Expanded 68dp/284dp → collapsed 56dp/56dp, the same width/height
    // interpolation as the tab island's glass. The shade box follows the pill's
    // collapse, so a bottom-anchored hole keeps y = 10 through the whole sweep.
    expect(scrollFrames().map(frame => getShadeHoles(LAYOUT, frame).island)).toEqual([
      { height: 68, opacity: 1, width: 284, x: ROW_INNER_LEFT, y: 10 },
      { height: 65, opacity: 1, width: 227, x: ROW_INNER_LEFT, y: 10 },
      { height: 62, opacity: 1, width: 170, x: ROW_INNER_LEFT, y: 10 },
      { height: 59, opacity: 1, width: 113, x: ROW_INNER_LEFT, y: 10 },
      { height: 56, opacity: 1, width: 56, x: ROW_INNER_LEFT, y: 10 },
    ])
  })

  test('sweeps the search hole open from the search circle to the pill slot', () => {
    // A visible field forces the collapsed 56dp row; the pill keeps its right
    // inner edge anchored and grows leftward.
    const holes = SWEEP.map(
      openProgress =>
        getShadeHoles(LAYOUT, { ...BASE_FRAME, islandProgress: 1, openProgress }).search,
    )

    expect(holes).toEqual([
      { height: 56, opacity: 1, width: 56, x: ROW_INNER_LEFT + ROW_INNER_WIDTH - 56, y: 16 },
      { height: 56, opacity: 1, width: 116, x: 264, y: 16 },
      { height: 56, opacity: 1, width: 176, x: 204, y: 16 },
      { height: 56, opacity: 1, width: 236, x: 144, y: 16 },
      { height: 56, opacity: 1, width: 296, x: ROW_INNER_LEFT + 56 + 8, y: 16 },
    ])
  })

  test('sweeps focus: the island fades to zero width and the pill owns the row', () => {
    const frames = SWEEP.map(focusProgress => ({
      ...BASE_FRAME,
      focusProgress,
      islandProgress: 1,
      openProgress: 1,
    }))

    expect(frames.map(frame => getShadeHoles(LAYOUT, frame).island)).toEqual([
      { height: 56, opacity: 1, width: 56, x: ROW_INNER_LEFT, y: 16 },
      { height: 56, opacity: 1, width: 42, x: ROW_INNER_LEFT, y: 16 },
      { height: 56, opacity: 1, width: 28, x: ROW_INNER_LEFT, y: 16 },
      { height: 56, opacity: 1, width: 14, x: ROW_INNER_LEFT, y: 16 },
      { height: 56, opacity: 1, width: 0, x: ROW_INNER_LEFT, y: 16 },
    ])
    expect(frames.map(frame => getShadeHoles(LAYOUT, frame).search)).toEqual([
      { height: 56, opacity: 1, width: 296, x: ROW_INNER_LEFT + 56 + 8, y: 16 },
      { height: 56, opacity: 1, width: 312, x: 68, y: 16 },
      { height: 56, opacity: 1, width: 328, x: 52, y: 16 },
      { height: 56, opacity: 1, width: 344, x: 36, y: 16 },
      { height: 56, opacity: 1, width: 360, x: ROW_INNER_LEFT, y: 16 },
    ])
  })

  test('sweeps the close circle presence and reserves its slot in the pill', () => {
    const frames = SWEEP.map(closeProgress => ({
      ...BASE_FRAME,
      closeProgress,
      focusProgress: 1,
      islandProgress: 1,
      openProgress: 1,
    }))

    expect(frames.map(frame => getShadeHoles(LAYOUT, frame).close)).toEqual([
      EMPTY_HOLE,
      { height: 14, opacity: 1, width: 14, x: 345, y: 37 },
      { height: 28, opacity: 1, width: 28, x: 338, y: 30 },
      { height: 42, opacity: 1, width: 42, x: 331, y: 23 },
      { height: 56, opacity: 1, width: 56, x: SCREEN_WIDTH - ROW_INNER_LEFT - 56, y: 16 },
    ])
    // The pill yields exactly one close circle + gap to the fading circle.
    expect(frames.map(frame => getShadeHoles(LAYOUT, frame).search.width)).toEqual([
      360, 344, 328, 312, 296,
    ])
  })

  test('sweeps the pill collapse, staying bottom-anchored in the shade box', () => {
    const frames = SWEEP.map(pillProgress => ({
      ...BASE_FRAME,
      pillProgress,
    }))

    expect(frames.map(frame => getShadeHoles({ ...LAYOUT, hasPill: true }, frame).pill)).toEqual([
      { height: 48, opacity: 1, width: 360, x: ROW_INNER_LEFT, y: 10 },
      { height: 50, opacity: 1, width: 328, x: 36, y: 10 },
      { height: 52, opacity: 1, width: 296, x: 52, y: 10 },
      { height: 54, opacity: 1, width: 264, x: 68, y: 10 },
      { height: 56, opacity: 1, width: 232, x: 84, y: 10 },
    ])
  })

  test('keeps the row holes and the pill hole on their own offsets in one frame', () => {
    const holes = getShadeHoles(
      { ...LAYOUT, hasPill: true },
      {
        closeProgress: 0.5,
        focusProgress: 0.5,
        islandProgress: 0.5,
        openProgress: 0.5,
        pillOpacity: 1,
        pillProgress: 0.5,
      },
    )

    // Island row: height 62 at island progress 0.5, width 170 faded by focus
    // 0.5; the pill shade blends toward the row with focus, so the shade box is
    // 108 tall and both bottom-anchored rects share y = 25. The pill hole
    // keeps the full glass height (52 at pill progress 0.5) and only its bottom
    // edge follows the tuck.
    expect(holes).toEqual({
      close: { height: 31, opacity: 1, width: 31, x: 333.5, y: 40.5 },
      island: { height: 62, opacity: 1, width: 85, x: ROW_INNER_LEFT, y: 25 },
      pill: { height: 52, opacity: 1, width: 296, x: 52, y: 27 },
      search: { height: 62, opacity: 1, width: 187, x: 185, y: 25 },
    })
  })

  test('keeps the tucked pill hole full-size and fades its strength with the pill', () => {
    // Focus tucks the detached pill behind the search row; the glass keeps its
    // full height, so the cutout must too, and its strength must follow the
    // pill's fade instead of collapsing to an empty rect.
    const tuckedFrame = { ...BASE_FRAME, focusProgress: 1, pillOpacity: 0.4 }
    const expectedRect = {
      height: 48,
      opacity: 0.4,
      width: ROW_INNER_WIDTH,
      x: ROW_INNER_LEFT,
      y: 14,
    }

    expect(getShadeHoles({ ...LAYOUT, hasPill: true }, tuckedFrame).pill).toEqual(expectedRect)
    expect(
      getShadeHoles({ ...LAYOUT, hasPill: true }, { ...tuckedFrame, pillOpacity: 0 }).pill,
    ).toEqual({ ...expectedRect, opacity: 0 })
  })

  test('gives the admin row, which has no search chrome, the full inner width', () => {
    expect(getShadeHoles({ ...LAYOUT, hasSearch: false }, BASE_FRAME)).toEqual({
      close: EMPTY_HOLE,
      island: { height: 68, opacity: 1, width: ROW_INNER_WIDTH, x: ROW_INNER_LEFT, y: 10 },
      pill: EMPTY_HOLE,
      search: EMPTY_HOLE,
    })
  })

  test('clamps every progress input to 0..1', () => {
    const negative = getShadeHoles(LAYOUT, {
      closeProgress: -1,
      focusProgress: -1,
      islandProgress: -1,
      openProgress: -1,
      pillOpacity: -1,
      pillProgress: -1,
    })
    const above = getShadeHoles(LAYOUT, {
      closeProgress: 2,
      focusProgress: 2,
      islandProgress: 2,
      openProgress: 2,
      pillOpacity: 2,
      pillProgress: 2,
    })

    expect(negative).toEqual(
      getShadeHoles(LAYOUT, { ...BASE_FRAME, islandProgress: 0, pillProgress: 0 }),
    )
    expect(above.island.width).toBe(0)
    expect(above.search.x).toBe(ROW_INNER_LEFT)
  })
})
