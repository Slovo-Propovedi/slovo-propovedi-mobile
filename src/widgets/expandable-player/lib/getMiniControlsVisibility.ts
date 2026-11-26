/**
 * Chrome widths (pt) at which each wide-pill control disappears: a control
 * renders only at or above its threshold. Thresholds are measured on the CHROME
 * (`getWideChromeWidth`), not the window, so a wide window cannot hide a button
 * while the chrome still has free side space. The wide chrome is a constant
 * 550pt today, so nothing hides in the current wide range; the cascade only
 * fires for a future narrower chrome. Order stays monotonic — every threshold
 * is lower than the previous one — so the row never re-adds a button while the
 * chrome narrows.
 */
export const MINI_WIDE_CONTROL_HIDE_WIDTHS = {
  favorite: 476,
  menu: 524,
  next: 444,
  previous: 460,
  queue: 508,
  repeat: 492,
  text: 540,
} as const

export interface MiniControlsVisibility {
  /** Which end of the pill the transport cluster hugs: right once the right cluster is gone. */
  clusterSide: 'left' | 'right'
  favorite: boolean
  menu: boolean
  next: boolean
  previous: boolean
  queue: boolean
  repeat: boolean
  text: boolean
}

/**
 * Derives which wide-pill controls fit the current chrome width. Plain
 * render-time math (not a worklet): the row uses it only for conditional
 * rendering.
 * @param chromeWidth - Inner width of the wide chrome (`getWideChromeWidth`).
 */
export const getMiniControlsVisibility = (chromeWidth: number): MiniControlsVisibility => {
  const text = chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.text
  const menu = chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.menu
  const queue = chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.queue
  const hasRightCluster = text || menu || queue

  return {
    clusterSide: hasRightCluster ? 'left' : 'right',
    favorite: chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.favorite,
    menu,
    next: chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.next,
    previous: chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.previous,
    queue,
    repeat: chromeWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.repeat,
    text,
  }
}
