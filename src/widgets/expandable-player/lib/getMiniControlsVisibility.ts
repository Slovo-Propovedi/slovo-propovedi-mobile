/**
 * Screen widths (pt) at which each wide-pill control disappears: a control
 * renders only at or above its threshold. The right cluster goes first, one
 * button at a time, then the transport cluster thins out until only play is
 * left just above the 768 phone breakpoint. Order stays monotonic — every
 * threshold is lower than the previous one — so the row never re-adds a button
 * while the window narrows.
 */
export const MINI_WIDE_CONTROL_HIDE_WIDTHS = {
  favorite: 832,
  menu: 920,
  next: 784,
  previous: 808,
  queue: 880,
  repeat: 856,
  text: 960,
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
 * Derives which wide-pill controls fit the current screen width. Plain
 * render-time math (not a worklet): the row uses it only for conditional
 * rendering.
 * @param screenWidth - Current window width in pt.
 */
export const getMiniControlsVisibility = (screenWidth: number): MiniControlsVisibility => {
  const text = screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.text
  const menu = screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.menu
  const queue = screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.queue
  const hasRightCluster = text || menu || queue

  return {
    clusterSide: hasRightCluster ? 'left' : 'right',
    favorite: screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.favorite,
    menu,
    next: screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.next,
    previous: screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.previous,
    queue,
    repeat: screenWidth >= MINI_WIDE_CONTROL_HIDE_WIDTHS.repeat,
    text,
  }
}
