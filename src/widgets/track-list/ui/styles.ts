import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

export const TRACK_LIST_ITEM_SIZES = {
  albumArtSize: 50,
  leftOffset: 60,
} as const

export const tracksListStyles = StyleSheet.create({
  albumArt: {
    borderRadius: RADIUSES.low,
    height: TRACK_LIST_ITEM_SIZES.albumArtSize,
    width: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  albumArtContainer: {
    marginRight: INDENTS.middle,
    position: 'relative',
  },
  albumArtPlaying: {
    opacity: 0.6,
  },
  artist: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.lowest,
  },
  cacheIconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    bottom: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 24,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  contextMenuItem: {
    padding: INDENTS.medium,
  },
  contextMenuItemText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
  divider: {
    backgroundColor: COLORS.surface,
    height: 1,
    marginLeft: TRACK_LIST_ITEM_SIZES.leftOffset,
    marginVertical: INDENTS.low,
  },
  dotsButton: {
    padding: INDENTS.low,
  },
  dropdownMenu: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    elevation: 101,
    position: 'absolute',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 101,
  },
  itemContainer: {
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
  },
  itemContainerActive: {
    zIndex: 100,
  },
  playOrSoundBarsIconContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    bottom: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  titlePlaying: {
    color: COLORS.primary,
  },
})

export const queueControlsStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUSES.round,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: INDENTS.middle,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginLeft: INDENTS.low,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
  },
  icon: {
    tintColor: COLORS.onPrimary,
  },
})
