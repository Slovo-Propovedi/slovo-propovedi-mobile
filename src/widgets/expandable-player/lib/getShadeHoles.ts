import { BAR_CIRCLE_SIZE, BAR_OUTER_GAP, TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'
import { getSearchShadeHoles } from './getSearchShadeHoles'
import { getShadeRow, type ShadeHole, type ShadeRow, toShadeHole } from './shadeRow'

interface ShadeHoleInput {
  /** Settled pill morph: 0 = detached pill, 1 = pill in the collapsed row. */
  barCollapsed: boolean
  fullScreenHeight: number
  /** The external ✕ is on screen (field focused or query active). */
  hasClose: boolean
  hasPill: boolean
  /** This zone mounts the search chrome (hidden on the admin tab layout). */
  hasSearch: boolean
  isFocused: boolean
  isSearchVisible: boolean
  screenWidth: number
  /** Settled shade height; holes are bottom-anchored inside it. */
  shadeHeight: number
  tabBarHeight: number
}

const getIslandHole = (
  row: ShadeRow,
  {
    hasSearch,
    isFocused,
  }: {
    hasSearch: boolean
    isFocused: boolean
  },
): null | ShadeHole => {
  // Focus fades the whole tab island out of the row.
  if (isFocused) return null

  if (row.collapsed) return toShadeHole(row, row.innerLeft, BAR_CIRCLE_SIZE)

  const width = hasSearch
    ? row.innerWidth - TAB_BAR_ISLAND_HEIGHT_EXPANDED - BAR_OUTER_GAP
    : row.innerWidth

  return toShadeHole(row, row.innerLeft, width)
}

const getPillHole = (row: ShadeRow, input: ShadeHoleInput): null | ShadeHole => {
  // Focused, the pill slides behind the search row, so no pill hole is needed.
  if (!input.hasPill || input.isFocused) return null

  const pill = getMiniPlayerGeometry({
    barProgress: input.barCollapsed ? 1 : 0,
    fullScreenHeight: input.fullScreenHeight,
    screenWidth: input.screenWidth,
    tabBarHeight: input.tabBarHeight,
  })
  const height = PLAYER_SIZES.miniPlayerHeight

  return {
    height,
    width: pill.width,
    x: pill.left,
    y: row.shadeHeight - (pill.bottom + height),
  }
}

/**
 * Footprints of the bottom chrome, to be cut out of the shade so the glass
 * never samples the gradient it sits on. Each hole is the settled shape of one
 * island: the chrome covers itself while morphing, so a sliver at a hole edge
 * can flash for the 300 ms dance without being visible.
 * @param input - Settled chrome state plus the shade box geometry.
 * @returns Bottom-anchored rectangles in the shade box's coordinate space.
 */
export const getShadeHoles = (input: ShadeHoleInput): ShadeHole[] => {
  const row = getShadeRow(input)
  const holes: ShadeHole[] = []
  const island = getIslandHole(row, input)

  if (island) holes.push(island)

  if (!input.hasSearch) return holes

  holes.push(...getSearchShadeHoles(row, input))

  const pill = getPillHole(row, input)

  if (pill) holes.push(pill)

  return holes
}
