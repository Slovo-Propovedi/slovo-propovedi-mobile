import { StyleSheet } from 'react-native'
import { APP_MAX_CONTENT_WIDTH } from 'shared/ui/layout'
import { INDENTS, RADIUSES } from 'shared/ui/theme'

// Desktop-web cap for the fullscreen artwork square.
const FULLSCREEN_ARTWORK_MAX_WIDTH = 480

export const expandedLayoutStyles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFill,
  },

  // Dim layer between the blurred cover background and the artwork square; keeps
  // header/controls readable while the hue still follows the artwork.
  backgroundScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  bottomContentContainer: {
    paddingBottom: INDENTS.high * 2,
    paddingHorizontal: INDENTS.medium,
  },

  fullContainer: {
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },

  // Artwork square in fullscreen, geometry mirrors the square slider cards
  // ("На неделю"): height == width, RADIUSES.slider corners, cover-fit.
  fullscreenArtwork: {
    aspectRatio: 1,
    borderRadius: RADIUSES.slider,
    maxWidth: FULLSCREEN_ARTWORK_MAX_WIDTH,
    overflow: 'hidden',
    width: '80%',
  },

  // Flex-column space between header and controls; centers the square.
  fullscreenArtworkWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  spacer: {
    flex: 1,
  },

  trackInfoRow: {
    alignItems: 'center',
    // Desktop-web: the title and the [♥][＋] favorite cluster stay in a centered
    // column; the progress bar and header below/above keep the full width.
    alignSelf: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.high,
    maxWidth: APP_MAX_CONTENT_WIDTH,
    width: '100%',
  },

  trackInfoTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
})
