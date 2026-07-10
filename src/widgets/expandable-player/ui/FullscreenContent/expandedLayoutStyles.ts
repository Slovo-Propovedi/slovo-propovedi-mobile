import { StyleSheet } from 'react-native'
import { INDENTS } from 'shared/ui/themed'

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
    flexDirection: 'row',
    marginBottom: INDENTS.high,
  },

  trackInfoTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
})
