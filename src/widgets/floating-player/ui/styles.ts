import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/themed'

export const styles = StyleSheet.create({
  albumArt: {
    borderRadius: RADIUSES.low,
    height: 40,
    width: 40,
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    bottom: 85,
    elevation: 5,
    flexDirection: 'row',
    height: PLAYER_SIZES.miniPlayerHeight,
    left: INDENTS.low,
    paddingHorizontal: INDENTS.low,
    position: 'absolute',
    right: INDENTS.low,
    zIndex: 100,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginRight: 4,
  },
  playlistName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: INDENTS.middle,
    marginRight: 8,
    overflow: 'hidden',
  },
  trackTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
})
