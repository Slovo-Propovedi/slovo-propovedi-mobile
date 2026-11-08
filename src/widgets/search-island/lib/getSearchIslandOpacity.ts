/**
 * Opacity of the search pill frame during its morph.
 *
 * The pill disappears by geometry: it shrinks onto the search chip and only
 * then vanishes. Fading it on every frame is what made the close read as a
 * fade-out with a stuck last frame. So the frame stays fully opaque for every
 * animated frame and drops to 0 only once the close morph has settled
 * (`openProgress === 0` and the field is already hidden). On opening it is
 * opaque from the first frame, so the chip hands over without a gap.
 *
 * Worklet-safe: called from the pill's Reanimated animated style.
 * @param openProgress - 0 = collapsed onto the search circle, 1 = full slot.
 * @param isSearchFieldVisible - Current field visibility state.
 */
export const getSearchIslandOpacity = (
  openProgress: number,
  isSearchFieldVisible: boolean,
): number => {
  'worklet'
  return isSearchFieldVisible || openProgress > 0 ? 1 : 0
}
