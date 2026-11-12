import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

const TRACK_HEIGHT = 48
const TRACK_PADDING = 3
const ITEM_HEIGHT = 36
const PAGE_GUTTER = INDENTS.medium
const ROW_GUTTER = INDENTS.lowest
// The halo below the track is drawn outside its box; the scope wrappers keep
// that much real layout room (no negative margins) so nothing cuts it off.
const SHADOW_ROOM = 44

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
    paddingBottom: SHADOW_ROOM,
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: ROW_GUTTER,
  },
  scopeScroll: { flexGrow: 0 },
  scopeScrollContent: {
    paddingBottom: SHADOW_ROOM,
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
    bottom: -SHADOW_ROOM,
    left: -INDENTS.low,
    position: 'absolute',
    right: -INDENTS.low,
    top: -2,
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
