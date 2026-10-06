/** Rubber-band factor applied to the raw finger delta, so a pull feels elastic. */
const PULL_RESISTANCE = 0.4
/** Displayed pull distance (after resistance) that arms a refresh. */
export const TRIGGER_DISTANCE = 64
/** Height of the top spinner slot; content rests here while a refresh is active. */
export const SPINNER_SLOT_HEIGHT = 40
/** Minimum gap between two pull-to-refresh reloads. */
export const REFRESH_MIN_INTERVAL_MS = 2000
/** Duration of the content/spinner settle animation after a release. */
export const RESTING_DURATION_MS = 200

/**
 * Converts a raw downward finger delta into the visible pull distance.
 * @param rawDeltaY - Raw downward finger delta in pixels.
 * @returns The visible pull distance after resistance, never negative.
 */
export const computeDisplayedPull = (rawDeltaY: number): number =>
  Math.max(0, rawDeltaY * PULL_RESISTANCE)

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
