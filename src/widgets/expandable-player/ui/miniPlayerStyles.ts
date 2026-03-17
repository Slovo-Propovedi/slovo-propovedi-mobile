import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/themed'

export const miniPlayerStyles = StyleSheet.create({
  miniContainer: {
    alignItems: 'center',
    bottom: PLAYER_SIZES.tabBarHeight + INDENTS.low,
    flexDirection: 'row',
    height: PLAYER_SIZES.miniPlayerHeight,
    left: INDENTS.low,
    paddingHorizontal: INDENTS.low,
    position: 'absolute',
    right: INDENTS.low,
    zIndex: 300,
  },
  miniControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  miniCover: {
    borderRadius: RADIUSES.low,
    height: 40,
    width: 40,
  },
  miniOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
  },
  miniPlaylistName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  miniTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: INDENTS.low,
    marginRight: INDENTS.low,
    overflow: 'hidden',
  },
  miniTrackTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
})
