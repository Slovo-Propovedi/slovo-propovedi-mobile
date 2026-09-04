import { StyleSheet } from 'react-native'
import { APP_MAX_CONTENT_WIDTH } from 'shared/ui/layout'
import { INDENTS } from 'shared/ui/theme'

export const expandedLayoutStyles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFill,
  },

  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },

  blurOverlay: {
    ...StyleSheet.absoluteFill,
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

  spacer: {
    flex: 1,
  },

  trackInfoRow: {
    alignItems: 'center',
    // Desktop-web: title + menu button stay in a centered column; the progress
    // bar and header below/above keep the full width.
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
