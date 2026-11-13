import {
  EMPTY_SHADE_HOLE,
  SEARCH_SLOT_WIDTH,
  type ShadeHole,
  type ShadeRow,
  toShadeHole,
} from './shadeRow'

interface SearchShadeInput {
  /** 0 = no external close circle, 1 = the pill yields a full circle + gap. */
  closeProgress: number
  /** 0 = active-tab circle still in the row, 1 = field focused. */
  focusProgress: number
  /** This zone mounts the search chrome. */
  hasSearch: boolean
  /** 0 = search circle, 1 = pill fills its row slot. */
  openProgress: number
  screenWidth: number
}

const clampProgress = (progress: number) => {
  'worklet'

  return Math.min(Math.max(progress, 0), 1)
}

// The ✕ keeps the search frame's height and scales about its own centre; a
// zero presence is a zero-size rect so nothing is cut where no circle exists.
const getCloseHole = (
  row: ShadeRow,
  { close, screenWidth }: { close: number; screenWidth: number },
): ShadeHole => {
  'worklet'
  const size = row.height * close

  if (size <= 0) return EMPTY_SHADE_HOLE

  // The close circle's right edge is inset by the row's inner left, exactly as
  // `getSearchIslandGeometry` reports `closeRight`.
  const centerX = screenWidth - row.innerLeft - row.height / 2
  const centerYFromBottom = row.bottom + row.height / 2

  return {
    height: size,
    opacity: 1,
    width: size,
    x: centerX - size / 2,
    y: row.shadeHeight - centerYFromBottom - size / 2,
  }
}

/**
 * Cutouts for the search frame and its external close circle, mirroring the
 * search island's `getSearchIslandGeometry` frame by frame. Both rects are
 * fixed slots: the close circle collapses to a zero-size rect instead of
 * remounting a mask node mid-morph.
 *
 * Worklet-safe: called from the animated hole props.
 * @param row - Islands row at the current frame.
 * @param input - Search morph progress and viewport geometry.
 */
export const getSearchShadeHoles = (
  row: ShadeRow,
  input: SearchShadeInput,
): { close: ShadeHole; search: ShadeHole } => {
  'worklet'
  if (!input.hasSearch) return { close: EMPTY_SHADE_HOLE, search: EMPTY_SHADE_HOLE }

  const open = clampProgress(input.openProgress)
  const focus = clampProgress(input.focusProgress)
  const close = clampProgress(input.closeProgress)
  const { height, innerLeft, innerWidth } = row
  // Same closed shape as the search chip: a circle pinned to the right inner
  // edge, growing leftwards into the slot right of the active-tab circle.
  const circleLeft = innerLeft + innerWidth - height
  const tabSlot = SEARCH_SLOT_WIDTH * (1 - focus)
  const slotLeft = innerLeft + tabSlot
  const left = circleLeft + (slotLeft - circleLeft) * open
  const closeSlot = SEARCH_SLOT_WIDTH * close * open
  const openWidth = innerWidth - tabSlot - closeSlot
  const width = height + (openWidth - height) * open

  return {
    close: getCloseHole(row, { close, screenWidth: input.screenWidth }),
    search: toShadeHole(row, left, width, height),
  }
}
