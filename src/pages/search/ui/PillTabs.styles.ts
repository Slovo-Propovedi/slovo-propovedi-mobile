import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

const TRACK_HEIGHT = 48
const TRACK_PADDING = 3
const PAGE_GUTTER = INDENTS.medium
const ROW_GUTTER = INDENTS.lowest
// The drop shadow reaches offsetY 16 + blur 38/2 ≈ 35dp below the track and
// blur/2 ≈ 19dp to the sides. Wrappers pad that much outward so the shadow is
// painted outside the pill instead of being cut at a wrapper/scroll boundary.
const SHADOW_SIDE_ROOM = INDENTS.medium + INDENTS.lowest
const SHADOW_BOTTOM_ROOM = 36
// Added room is compensated with negative margins to keep the previous spacing.
const SHADOW_ROOM_SIDE_OFFSET = PAGE_GUTTER - SHADOW_SIDE_ROOM
const SHADOW_ROOM_BOTTOM_OFFSET = ROW_GUTTER - SHADOW_BOTTOM_ROOM

export const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZES.base },
  scrollCompact: { flexGrow: 0 },
  scrollContentCompact: {
    paddingHorizontal: PAGE_GUTTER,
    paddingVertical: ROW_GUTTER,
  },
  scrollContentRoom: {
    paddingBottom: SHADOW_BOTTOM_ROOM,
    paddingHorizontal: SHADOW_SIDE_ROOM,
    paddingTop: ROW_GUTTER,
  },
  scrollRoom: {
    flexGrow: 0,
    marginBottom: SHADOW_ROOM_BOTTOM_OFFSET,
    marginHorizontal: SHADOW_ROOM_SIDE_OFFSET,
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
  stretchRowCompact: {
    paddingHorizontal: PAGE_GUTTER,
    paddingVertical: ROW_GUTTER,
  },
  stretchRowRoom: {
    marginBottom: SHADOW_ROOM_BOTTOM_OFFSET,
    marginHorizontal: SHADOW_ROOM_SIDE_OFFSET,
    overflow: 'visible',
    paddingBottom: SHADOW_BOTTOM_ROOM,
    paddingHorizontal: SHADOW_SIDE_ROOM,
    paddingTop: ROW_GUTTER,
  },
  track: {
    borderRadius: RADIUSES.round,
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    // The shadow is drawn outside the pill, so nothing here may clip it.
    overflow: 'visible',
    padding: TRACK_PADDING,
  },
  // Deep downward-only drop shadow: a third of the 48dp track height, with a
  // wide blur so the track reads as lifted, not outlined. boxShadow alone
  // renders on Android too (New Architecture); elevation is intentionally
  // absent — it hugs the view outline and reads as a border ring.
  trackShadow: { boxShadow: '0px 16px 38px rgba(0, 0, 0, 0.06)' },
  trackStretch: { flexGrow: 1 },
})
