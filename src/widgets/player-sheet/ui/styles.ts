import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed'

const ALBUM_ART_SIZE = 280

export const styles = StyleSheet.create({
  albumArt: {
    borderRadius: RADIUSES.middle,
    height: ALBUM_ART_SIZE,
    width: ALBUM_ART_SIZE,
  },
  albumArtContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  artistName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },
  container: {
    zIndex: 200,
  },
  content: {
    flex: 1,
    paddingHorizontal: INDENTS.high,
  },
  controlsContainer: {
    marginVertical: INDENTS.high,
  },
  progressContainer: {
    marginTop: INDENTS.high,
  },
  repeatContainer: {
    alignItems: 'center',
    marginBottom: INDENTS.high,
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUSES.high,
    borderTopRightRadius: RADIUSES.high,
  },
  trackInfoContainer: {
    alignItems: 'center',
    marginTop: INDENTS.high,
  },
  trackTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  volumeContainer: {
    marginTop: INDENTS.high,
  },
})
