export type MenuPlacement = 'above' | 'below'

export interface MenuPosition {
  right: number
  top: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

// Pure geometry: given the anchor rect (viewport coords), the measured menu
// size and the window size, returns the absolute top/right that keeps the menu
// fully inside the window with a `gap` margin on every edge. By default the menu
// prefers to open above the anchor and flips below when there is not enough
// room; `placement: 'below'` (e.g. a top-bar profile button) prefers opening
// below and only flips above when the menu cannot fit below.
export const computeMenuPosition = (
  anchor: { height: number; width: number; x: number; y: number },
  menuSize: { height: number; width: number },
  windowSize: { height: number; width: number },
  gap: number,
  placement: MenuPlacement = 'above',
): MenuPosition => {
  const fitsAbove = anchor.y >= menuSize.height + gap
  const fitsBelow = windowSize.height - anchor.y - anchor.height >= menuSize.height + gap
  const opensAbove = placement === 'above' ? fitsAbove : !fitsBelow
  const preferredTop = opensAbove
    ? anchor.y - menuSize.height - gap
    : anchor.y + anchor.height + gap
  const preferredRight = windowSize.width - anchor.x - anchor.width

  const top = clamp(preferredTop, gap, windowSize.height - menuSize.height - gap)
  const right = clamp(preferredRight, gap, windowSize.width - menuSize.width - gap)

  return { right, top }
}
