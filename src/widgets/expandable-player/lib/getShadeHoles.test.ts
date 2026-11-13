import { getShadeHoles } from './getShadeHoles'

// Fixture: a 400dp phone with a 14dp bottom inset. The tab row is
// BAR_ROW_MIN_HEIGHT (84) plus that inset, so the measured row height is 98.
const SCREEN_WIDTH = 400
const TAB_BAR_HEIGHT = 98
const BOTTOM_PADDING = 14
const FULL_SCREEN_HEIGHT = 800
// The centered content column is wider than the viewport, so its inset is 0;
// the row then pads by BAR_SIDE_INSET (16) on each side.
const ROW_INNER_LEFT = 16
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
  pillProgress: 0,
}

const EMPTY_HOLE = { height: 0, width: 0, x: 0, y: 0 }
const SWEEP = [0, 0.25, 0.5, 0.75, 1]

// Pill progress = bar collapse, island progress = bar collapse OR search
// visible. A plain scroll collapse drives both, so the island sweep flips both
// to keep the shade box and the row at the same settle point.
const scrollFrames = () =>
  SWEEP.map(islandProgress => ({ ...BASE_FRAME, islandProgress, pillProgress: islandProgress }))

describe('getShadeHoles', () => {
  test('sweeps the island hole with the island collapse morph', () => {
    // Expanded 76dp/286dp → collapsed 64dp/64dp, the same width/height
    // interpolation as the tab island's glass. The shade box follows the pill's
    // collapse, so a bottom-anchored hole keeps y = 10 through the whole sweep.
    expect(scrollFrames().map(frame => getShadeHoles(LAYOUT, frame).island)).toEqual([
      { height: 76, width: 286, x: ROW_INNER_LEFT, y: 10 },
      { height: 73, width: 230.5, x: ROW_INNER_LEFT, y: 10 },
      { height: 70, width: 175, x: ROW_INNER_LEFT, y: 10 },
      { height: 67, width: 119.5, x: ROW_INNER_LEFT, y: 10 },
      { height: 64, width: 64, x: ROW_INNER_LEFT, y: 10 },
    ])
  })

  test('sweeps the search hole open from the search circle to the pill slot', () => {
    // A visible field forces the collapsed 64dp row; the pill keeps its right
    // inner edge anchored and grows leftward.
    const holes = SWEEP.map(
      openProgress =>
        getShadeHoles(LAYOUT, { ...BASE_FRAME, islandProgress: 1, openProgress }).search,
    )

    expect(holes).toEqual([
      { height: 64, width: 64, x: ROW_INNER_LEFT + ROW_INNER_WIDTH - 64, y: 16 },
      { height: 64, width: 122.5, x: 261.5, y: 16 },
      { height: 64, width: 181, x: 203, y: 16 },
      { height: 64, width: 239.5, x: 144.5, y: 16 },
      { height: 64, width: 298, x: ROW_INNER_LEFT + 64 + 6, y: 16 },
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
      { height: 64, width: 64, x: ROW_INNER_LEFT, y: 16 },
      { height: 64, width: 48, x: ROW_INNER_LEFT, y: 16 },
      { height: 64, width: 32, x: ROW_INNER_LEFT, y: 16 },
      { height: 64, width: 16, x: ROW_INNER_LEFT, y: 16 },
      { height: 64, width: 0, x: ROW_INNER_LEFT, y: 16 },
    ])
    expect(frames.map(frame => getShadeHoles(LAYOUT, frame).search)).toEqual([
      { height: 64, width: 298, x: ROW_INNER_LEFT + 64 + 6, y: 16 },
      { height: 64, width: 315.5, x: 68.5, y: 16 },
      { height: 64, width: 333, x: 51, y: 16 },
      { height: 64, width: 350.5, x: 33.5, y: 16 },
      { height: 64, width: 368, x: ROW_INNER_LEFT, y: 16 },
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
      { height: 16, width: 16, x: 344, y: 40 },
      { height: 32, width: 32, x: 336, y: 32 },
      { height: 48, width: 48, x: 328, y: 24 },
      { height: 64, width: 64, x: SCREEN_WIDTH - ROW_INNER_LEFT - 64, y: 16 },
    ])
    // The pill yields exactly one close circle + gap to the fading circle.
    expect(frames.map(frame => getShadeHoles(LAYOUT, frame).search.width)).toEqual([
      368, 350.5, 333, 315.5, 298,
    ])
  })

  test('sweeps the pill collapse, staying bottom-anchored in the shade box', () => {
    const frames = SWEEP.map(pillProgress => ({
      ...BASE_FRAME,
      pillProgress,
    }))

    expect(frames.map(frame => getShadeHoles({ ...LAYOUT, hasPill: true }, frame).pill)).toEqual([
      { height: 64, width: 368, x: ROW_INNER_LEFT, y: 10 },
      { height: 64, width: 333, x: 33.5, y: 10 },
      { height: 64, width: 298, x: 51, y: 10 },
      { height: 64, width: 263, x: 68.5, y: 10 },
      { height: 64, width: 228, x: 86, y: 10 },
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
        pillProgress: 0.5,
      },
    )

    // Island row: height 70 at island progress 0.5, width 175 faded by focus
    // 0.5; the pill shade blends toward the row with focus, so the shade box is
    // 118.5 tall and both bottom-anchored rects share y = 27.5.
    expect(holes).toEqual({
      close: { height: 35, width: 35, x: 331.5, y: 45 },
      island: { height: 70, width: 87.5, x: ROW_INNER_LEFT, y: 27.5 },
      pill: { height: 32, width: 298, x: 51, y: 62.5 },
      search: { height: 70, width: 192.75, x: 182.5, y: 27.5 },
    })
  })

  test('collapses the pill hole as the focused search row tucks it away', () => {
    const frame = { ...BASE_FRAME, focusProgress: 1, pillProgress: 1 }

    expect(getShadeHoles({ ...LAYOUT, hasPill: true }, frame).pill).toEqual(EMPTY_HOLE)
  })

  test('gives the admin row, which has no search chrome, the full inner width', () => {
    expect(getShadeHoles({ ...LAYOUT, hasSearch: false }, BASE_FRAME)).toEqual({
      close: EMPTY_HOLE,
      island: { height: 76, width: ROW_INNER_WIDTH, x: ROW_INNER_LEFT, y: 10 },
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
      pillProgress: -1,
    })
    const above = getShadeHoles(LAYOUT, {
      closeProgress: 2,
      focusProgress: 2,
      islandProgress: 2,
      openProgress: 2,
      pillProgress: 2,
    })

    expect(negative).toEqual(
      getShadeHoles(LAYOUT, { ...BASE_FRAME, islandProgress: 0, pillProgress: 0 }),
    )
    expect(above.island.width).toBe(0)
    expect(above.search.x).toBe(ROW_INNER_LEFT)
  })
})
