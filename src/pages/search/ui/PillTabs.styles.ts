import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

const TRACK_HEIGHT = 48
const TRACK_PADDING = 3
// Definite numeric height for the pressable cell: stretch/percentage sizing
// does not reliably define the Android hit rect, an explicit size does.
const SEGMENT_HEIGHT = TRACK_HEIGHT - 2 * TRACK_PADDING
const ITEM_HEIGHT = 36
const PAGE_GUTTER = INDENTS.medium
const ROW_GUTTER = INDENTS.lowest
const SMALL_GAP = INDENTS.low
// The scope shadow is a dark copy of the pill shifted down under the track, so
// it peeks out at the bottom, plus a larger backdrop-blur frame on top of it:
// the blur smears the copy's edges and the shadow feathers along the contour.
const SHADOW_OFFSET_Y = 18
const SHADOW_FEATHER = INDENTS.medium + INDENTS.lowest
const SHADOW_FILL = 'rgba(0, 0, 0, 0.09)'
const SHADOW_BLUR_RADIUS = 10

export const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZES.base },
  resultsItem: {
    alignItems: 'center',
    borderRadius: RADIUSES.round,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.low,
  },
  resultsItemSelected: { paddingHorizontal: INDENTS.medium },
  resultsLabel: { fontSize: FONT_SIZES.md },
  resultsRow: {
    alignItems: 'center',
    gap: INDENTS.low,
    paddingHorizontal: PAGE_GUTTER,
    paddingVertical: ROW_GUTTER,
  },
  scopeRow: {
    overflow: 'visible',
    paddingBottom: SMALL_GAP,
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: ROW_GUTTER,
  },
  scopeScroll: { flexGrow: 0 },
  scopeScrollContent: {
    paddingBottom: SMALL_GAP,
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: ROW_GUTTER,
  },
  segment: {
    alignItems: 'center',
    borderRadius: RADIUSES.round,
    // The Pressable itself is the cell: numeric height + flex width make the
    // hit rect exactly the highlighted segment, padding-free. The background is
    // committed per state in PillTabSegment (unselected keeps a near-invisible
    // themed fill: Android needs a real drawable to route full-area taps).
    height: SEGMENT_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.middle,
  },
  segmentStretch: { flex: 1, paddingHorizontal: 0 },
  // The blur frame is bigger than the shadow body on every side; layer order is
  // body → blur → track, so the blur smears the body's edges under the pill.
  shadowBlur: {
    bottom: -(SHADOW_OFFSET_Y + SHADOW_FEATHER),
    left: -SHADOW_FEATHER,
    // Overlays interactive content, so it must never eat taps.
    pointerEvents: 'none',
    position: 'absolute',
    right: -SHADOW_FEATHER,
    top: SHADOW_OFFSET_Y - SHADOW_FEATHER,
  },
  shadowBody: {
    backgroundColor: SHADOW_FILL,
    borderRadius: RADIUSES.round,
    // Filter blur (RN New Arch, RenderEffect on Android 12+) feathering the body
    // in every direction; BlurView alone cannot blur without an Android target.
    filter: [{ blur: SHADOW_BLUR_RADIUS }],
    height: TRACK_HEIGHT,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: SHADOW_OFFSET_Y,
  },
  track: {
    borderRadius: RADIUSES.round,
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    overflow: 'visible',
    padding: TRACK_PADDING,
  },
  trackStretch: { flexGrow: 1 },
})
