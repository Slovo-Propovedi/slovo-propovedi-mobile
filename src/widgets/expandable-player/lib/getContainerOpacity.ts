// The fullscreen sheet has two opacity contracts, selected by whether the mini
// layer is mounted underneath it.
//
// Expand: the pill unmounts in the same commit the tap flips the expand state,
// so nothing is painted under the sheet and it must be binary — solid on every
// frame of the expand, including the tap/flick flip frame at progress 0. A tail
// ramp here left a transparent hole until progress reached the ramp start.
//
// Collapse: the pill mounts underneath and crossfades with the sheet. The sheet
// keeps its solid `surface` opaque through the content fade-out, then dissolves
// into the pill over its tail; the pill is already fully opaque underneath by
// then, so no frame is transparent on both layers. At exact rest the sheet is
// hidden, otherwise its solid rectangle would sit under the translucent pill
// and turn the glass into a flat block.
const SHEET_FADE_FROM = 0.15
// One handoff point: the sheet is fully solid here and the pill stays fully
// opaque until here, so `getContainerOpacity + getMiniPlayerOpacity >= 1` holds
// by construction while the pill is mounted.
const CROSSFADE_HANDOFF = 0.5
const SHEET_OPAQUE_FROM = CROSSFADE_HANDOFF
const PILL_OPAQUE_UNTIL = CROSSFADE_HANDOFF
const PILL_FADE_TO = 0.75

/**
 * Opacity of the fullscreen container sheet at an expand/collapse progress.
 * On expand the mini layer is unmounted: nothing is painted underneath, so the
 * sheet is solid on every frame, the tap/flick flip frame included. On collapse
 * the pill is mounted and the sheet crossfades with it over its tail.
 * Worklet-safe: used directly by the container's animated style.
 * @param progress - Expand/collapse progress (0 = mini pill, 1 = fullscreen).
 * @param isMiniLayerMounted - Whether the pill is mounted under the sheet (collapse, not expand).
 */
export const getContainerOpacity = (progress: number, isMiniLayerMounted: boolean): number => {
  'worklet'
  if (!isMiniLayerMounted) return 1

  const ramp = (progress - SHEET_FADE_FROM) / (SHEET_OPAQUE_FROM - SHEET_FADE_FROM)

  return Math.min(Math.max(ramp, 0), 1)
}

/**
 * Opacity of the mini pill while it is mounted underneath the collapsing sheet.
 * The pill is mounted only on the collapse side: it fades in under the still
 * opaque sheet (transparent at progress >= 0.75, fully opaque by 0.5). On
 * expand the pill unmounts immediately and the sheet is solid there, so the
 * pill is never seen fading under a covering sheet in that direction.
 * @param progress - Expand/collapse progress (0 = mini pill, 1 = fullscreen).
 */
export const getMiniPlayerOpacity = (progress: number): number => {
  'worklet'
  const ramp = (progress - PILL_OPAQUE_UNTIL) / (PILL_FADE_TO - PILL_OPAQUE_UNTIL)

  return 1 - Math.min(Math.max(ramp, 0), 1)
}
