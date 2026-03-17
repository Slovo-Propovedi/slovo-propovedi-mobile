import { Dimensions, StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

export const styles = StyleSheet.create({
  artistName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },
  backdrop: {
    backgroundColor: COLORS.black,
    height: SCREEN_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: SCREEN_WIDTH,
    zIndex: 150,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: INDENTS.medium,
    position: 'absolute',
    width: 40,
    zIndex: 100,
  },
  closeIcon: {
    color: COLORS.textMuted,
    fontSize: 32,
  },
  container: {
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 200,
  },
  controlsContainer: {
    marginVertical: INDENTS.high,
  },
  fullContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  miniContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: INDENTS.low,
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
  progressContainer: {
    marginTop: INDENTS.highest,
    paddingHorizontal: INDENTS.high,
  },
  repeatContainer: {
    alignItems: 'center',
    marginBottom: INDENTS.high,
  },
  trackInfoContainer: {
    alignItems: 'center',
  },
  trackTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  volumeContainer: {
    marginTop: INDENTS.high,
    paddingHorizontal: INDENTS.high,
  },
})
