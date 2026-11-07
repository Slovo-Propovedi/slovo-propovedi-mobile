// The fullscreen container paints an opaque sheet; at rest (progress = 0) it
// would sit exactly under the translucent mini pill and turn the pill's
// BlurView backdrop into a solid rectangle. Hide the sheet only in the exact
// resting state: any non-zero expand/collapse progress keeps it visible for the
// morph (the mini pill fades out over the first 30% of the animation).
export const getContainerOpacity = (progress: number): number => {
  'worklet'
  return progress > 0 ? 1 : 0
}
