import { computeSpinnerTranslate, RESTING_DURATION_MS } from './pull-to-refresh.lib'

export const isDomNode = (node: unknown): node is HTMLElement =>
  typeof node === 'object' && node !== null && 'addEventListener' in node

export const isElementLike = (node: unknown): node is HTMLElement =>
  typeof node === 'object' && node !== null && 'scrollTop' in node

const setDistance = (
  content: HTMLElement | null,
  spinner: HTMLElement | null,
  distance: number,
  opacity: number,
) => {
  if (content) content.style.transform = `translateY(${distance}px)`
  if (spinner) {
    spinner.style.opacity = String(opacity)
    spinner.style.transform = `translateY(${computeSpinnerTranslate(distance)}px)`
  }
}

export const setTransition = (
  content: HTMLElement | null,
  spinner: HTMLElement | null,
  durationMs: number,
) => {
  if (content)
    content.style.transition = durationMs > 0 ? `transform ${durationMs}ms ease-out` : 'none'

  if (spinner)
    spinner.style.transition =
      durationMs > 0
        ? `opacity ${durationMs}ms ease-out, transform ${durationMs}ms ease-out`
        : 'none'
}

/**
 * Animates the content to `distance` and fades/centers the spinner.
 * @param content - Content element to translate (may be unmounted).
 * @param spinner - Spinner slot element to fade and center (may be unmounted).
 * @param distance - Target translateY distance in pixels.
 * @param opacity - Target spinner opacity, 0..1.
 */
export const settle = (
  content: HTMLElement | null,
  spinner: HTMLElement | null,
  distance: number,
  opacity: number,
) => {
  setTransition(content, spinner, RESTING_DURATION_MS)
  setDistance(content, spinner, distance, opacity)
}

/**
 * Applies a pull distance instantly (no transition) while the finger is down.
 * @param content - Content element to translate (may be unmounted).
 * @param spinner - Spinner slot element to fade and center (may be unmounted).
 * @param distance - TranslateY distance in pixels.
 * @param opacity - Spinner opacity, 0..1.
 */
export const dragTo = (
  content: HTMLElement | null,
  spinner: HTMLElement | null,
  distance: number,
  opacity: number,
) => {
  setDistance(content, spinner, distance, opacity)
}
