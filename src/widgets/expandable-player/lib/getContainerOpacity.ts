// Collapse is one progress-tied crossfade from the fullscreen sheet into the
// mini pill. The sheet keeps its solid `surface` opaque through the content
// fade-out (the fullscreen content is gone by progress 0.4), then dissolves
// into the pill over its tail; the pill is already fully opaque underneath so
// no frame is ever transparent on both layers. At exact rest the sheet is
// hidden, otherwise its solid rectangle would sit under the translucent pill
// and turn the glass into a flat block.
const SHEET_FADE_FROM = 0.15
const SHEET_OPAQUE_FROM = 0.5
const PILL_OPAQUE_UNTIL = 0.5
const PILL_FADE_TO = 0.75

/**
 * Opacity of the fullscreen container sheet at a collapse/expand progress.
 * Worklet-safe: used directly by the container's animated style.
 * @param progress - Expand/collapse progress (0 = mini pill, 1 = fullscreen).
 */
export const getContainerOpacity = (progress: number): number => {
  'worklet'
  const ramp = (progress - SHEET_FADE_FROM) / (SHEET_OPAQUE_FROM - SHEET_FADE_FROM)

  return Math.min(Math.max(ramp, 0), 1)
}

/**
 * Opacity of the mini pill at a collapse/expand progress. The pill mounts at
 * collapse start and stays fully opaque until the sheet starts dissolving; it
 * only fades out once the fully opaque sheet covers it again on expand.
 * @param progress - Expand/collapse progress (0 = mini pill, 1 = fullscreen).
 */
export const getMiniPlayerOpacity = (progress: number): number => {
  'worklet'
  const ramp = (progress - PILL_OPAQUE_UNTIL) / (PILL_FADE_TO - PILL_OPAQUE_UNTIL)

  return 1 - Math.min(Math.max(ramp, 0), 1)
}
