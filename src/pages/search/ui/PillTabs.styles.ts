import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

const TRACK_HEIGHT = 48
const TRACK_PADDING = 3
const ITEM_HEIGHT = 36
const PAGE_GUTTER = INDENTS.medium
const ROW_GUTTER = INDENTS.lowest
const SMALL_GAP = INDENTS.low
// The halo is a cast shadow: it overflows its row and tints the content below,
// so the row reserves only SMALL_GAP under the pill (no clipping, no negatives).
// Sides reach far past the visible falloff; the top sits behind the opaque pill.
const HALO_DEPTH = 124
const HALO_SIDE = 72
const HALO_TOP = INDENTS.middle

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
    backgroundColor: 'transparent',
    borderRadius: RADIUSES.round,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: INDENTS.middle,
  },
  segmentStretch: { flex: 1, paddingHorizontal: 0 },
  // Outer halo standing in for boxShadow, which Android paints as a background
  // drawable clipped to the view — an outset shadow there reads as an inner rim.
  shadowHalo: {
    borderRadius: RADIUSES.round,
    bottom: -HALO_DEPTH,
    left: -HALO_SIDE,
    // The halo overflows onto interactive content; it must never eat taps.
    pointerEvents: 'none',
    position: 'absolute',
    right: -HALO_SIDE,
    top: -HALO_TOP,
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
