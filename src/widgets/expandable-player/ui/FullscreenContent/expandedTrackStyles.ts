import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS } from 'shared/ui/theme'

export const expandedTrackStyles = StyleSheet.create({
  artistName: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.lg,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },

  nextSermonContainer: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: INDENTS.medium,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },

  nextSermonLabel: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },

  nextSermonTitle: {
    color: '#fff',
    fontSize: FONT_SIZES.xl,
    fontWeight: '500',
    marginTop: INDENTS.lowest,
    maxWidth: '80%',
    textAlign: 'center',
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
