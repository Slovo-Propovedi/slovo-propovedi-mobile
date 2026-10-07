/** Rubber-band factor applied to the raw finger delta, so a pull feels elastic. */
const PULL_RESISTANCE = 0.4
/** Displayed pull distance (after resistance) that arms a refresh. */
export const TRIGGER_DISTANCE = 64
/** Height of the top spinner slot; centered inside the gap freed by the pull. */
export const SPINNER_SLOT_HEIGHT = 40
/** Minimum gap between two pull-to-refresh reloads. */
export const REFRESH_MIN_INTERVAL_MS = 2000
/** Duration of the content/spinner settle animation after a release. */
export const RESTING_DURATION_MS = 200

/**
 * Converts a raw downward finger delta into the visible pull distance.
 *
 * Resistance softens the pull between 0 and the threshold; past it the content
 * stops moving, so `maxDistance` caps the result.
 * @param rawDeltaY - Raw downward finger delta in pixels.
 * @param maxDistance - Upper bound of the visible pull distance.
 * @returns The visible pull distance after resistance, within `0..maxDistance`.
 */
export const computeDisplayedPull = (rawDeltaY: number, maxDistance = TRIGGER_DISTANCE): number =>
  Math.min(maxDistance, Math.max(0, rawDeltaY * PULL_RESISTANCE))

/**
 * Vertical offset that centers the spinner slot inside the freed top gap.
 *
 * The gap equals the content's translate; the slot is `SPINNER_SLOT_HEIGHT`
 * tall, so the offset is half the leftover space. Never negative — a gap
 * shorter than the slot leaves the spinner pinned at the top.
 * @param contentTranslate - Current content translateY in pixels.
 * @returns The spinner slot translateY in pixels.
 */
export const computeSpinnerTranslate = (contentTranslate: number): number =>
  Math.max(0, (contentTranslate - SPINNER_SLOT_HEIGHT) / 2)

/**
 * True when the pull is past the trigger threshold and the debounce has elapsed.
 * @param displayedPull - Visible pull distance after resistance.
 * @param elapsedMs - Milliseconds since the previous refresh trigger.
 * @returns Whether a refresh may start now.
 */
export const shouldTriggerRefresh = (displayedPull: number, elapsedMs: number): boolean =>
  displayedPull >= TRIGGER_DISTANCE && elapsedMs >= REFRESH_MIN_INTERVAL_MS

/**
 * Walks up the DOM from `node` to the nearest vertical scroll container.
 *
 * An element is a vertical scroller only when its content overflows AND its
 * computed `overflow-y` allows scrolling — `scrollHeight`/`clientHeight` alone
 * would match wrappers that merely clip (`overflow: hidden`).
 * @param node - Element to start the walk from (usually the touch target).
 * @param getOverflowY - Reads the computed `overflow-y` of a candidate element.
 * @returns The nearest vertical scroller, or `null` when there is none.
 */
export const findVerticalScrollableAncestor = (
  node: HTMLElement | null,
  getOverflowY: (node: HTMLElement) => string,
): HTMLElement | null => {
  let current = node

  while (current) {
    const overflowY = getOverflowY(current)
    if (
      current.scrollHeight > current.clientHeight &&
      (overflowY === 'auto' || overflowY === 'scroll')
    )
      return current

    current = current.parentElement
  }

  return null
}
