import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

// Horizontal inset so the pill never slides under the 40×40 close button
// (expandedControlsStyles.closeButton: left: INDENTS.medium, width: 40).
const CLOSE_BUTTON_SAFE_AREA = INDENTS.medium + 40 + INDENTS.medium

export const expandedTrackStyles = StyleSheet.create({
  artistName: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.lg,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },

  nextSermonAnchor: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: CLOSE_BUTTON_SAFE_AREA,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },

  nextSermonChevron: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.md,
  },

  nextSermonContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUSES.round,
    borderWidth: 1,
    maxWidth: '100%',
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.low,
  },

  nextSermonLabel: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },

  nextSermonRow: {
    alignItems: 'center',
    columnGap: INDENTS.low,
    flexDirection: 'row',
  },

  nextSermonTitle: {
    color: '#fff',
    fontSize: FONT_SIZES.xl,
    fontWeight: '500',
    marginTop: INDENTS.lowest,
    textAlign: 'center',
  },

  nextSermonTitleWrapper: {
    overflow: 'hidden',
  },

  timeText: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    width: 50,
  },

  trackTitle: {
    color: '#fff',
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
