interface SearchIslandGeometry {
  bottom: number
  /** Right inset of the external close circle, aligned with the search circle. */
  closeRight: number
  height: number
  /** Distance from the container's left edge to the always-mounted magnifier. */
  iconInset: number
  /** Diameter of the magnifier, constant in every state. */
  iconSize: number
  left: number
  radius: number
  width: number
}

interface SearchIslandGeometryInput {
  /** 0 = no external close circle, 1 = the pill yields a full circle + gap to it. */
  closeProgress?: number
  /** 0 = active-tab circle still shown, 1 = field focused and the pill owns the row. */
  focusProgress?: number
  /** 0 = expanded bar, 1 = bar collapsed to one line (compact chip + wider outer inset). */
  oneLineProgress: number
  /** 0 = pill coincides with the search circle, 1 = pill fills its row slot. */
  openProgress: number
  screenWidth: number
  tabBarHeight: number
}

export { type SearchIslandGeometry, type SearchIslandGeometryInput }
