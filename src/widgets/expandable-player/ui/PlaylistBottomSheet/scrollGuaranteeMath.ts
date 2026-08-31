// One row minimum guarantee: row ≈ albumArt(50) + paddingVertical(12×2) + 10 ≈ 84.
export const MIN_GUARANTEE = 84

// Dynamic scroll guarantee for the queue sheet (issue #69).
//
// DESIGN INVARIANT: maxHeight makes the list wrapper's bottom coincide with
// the screen bottom at every snap, on every device:
//   wrapper_bottom = sheetTop + chromeOffset + maxHeight
//                  = sheetTop + chromeOffset + (windowHeight − sheetTop − chromeOffset)
//                  = windowHeight  (exactly)
// The footer's belowScreen term is the safety net — if the maxHeight style
// ever fails to apply (e.g. during the first measurement cycle before
// chromeOffset is resolved), the footer still compensates to guarantee
// edge clearance.
//
// chromeOffset is measured via measureInWindow on the settled sheet: the
// distance from the screen top down to the list wrapper's top edge
// (= gorhom handle + title + any container padding). The measurement only
// runs on settle (settleTick) because the sheet's position is only final
// after the snap animation completes — measuring mid-animation yields
// a transient y that would be wrong.
//
// Sanity (test device): window H=891.43, topInset=47,
//   snaps [70%, H−topInset] → sheetTop 267.4 / 47,
//   measured chrome ≈ 69 (handle+title).
//   maxHeight ≈ 555 at 70%, ≈ 775 at 100%.
//   Footer for a 7-sermon list ≈ 139 → overscroll past end ≈ 155px (was ~1000).
//
// The raw content height (h − footer) is invariant under footer changes, so
// the computation converges to a fixed point — no oscillation.

/**
 * Distance the list frame extends below the screen bottom (0 if fully on-screen).
 * @param sheetTop — top of the sheet in screen coords.
 * @param chromeOffset — measured distance from screen top to wrapper top.
 * @param frameHeight — measured height of the list wrapper.
 * @param windowHeight — device window height.
 */
export const computeBelowScreenOffset = (
  sheetTop: number,
  chromeOffset: null | number,
  frameHeight: number,
  windowHeight: number,
): number =>
  chromeOffset === null ? 0 : Math.max(0, sheetTop + chromeOffset + frameHeight - windowHeight)

/**
 * Compute the footer height satisfying both drag-guarantee and edge-clearance.
 * @param frame — measured frame height.
 * @param raw — raw content height (without footer).
 * @param frameBottomBelowScreen — distance frame extends below screen.
 */
export const computeFooterHeight = (
  frame: number,
  raw: number,
  frameBottomBelowScreen: number,
): number =>
  Math.max(
    MIN_GUARANTEE,
    Math.ceil(frame - raw + MIN_GUARANTEE + frameBottomBelowScreen),
    Math.ceil(frameBottomBelowScreen) + MIN_GUARANTEE,
  )
