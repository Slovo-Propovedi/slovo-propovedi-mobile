import { StyleSheet } from 'react-native'
import { APP_MAX_CONTENT_WIDTH } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS } from 'shared/ui/theme'

export const expandedControlsStyles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: INDENTS.medium,
    position: 'absolute',
    width: 40,
    zIndex: 300,
  },

  closeIcon: {
    color: '#fff',
    fontSize: FONT_SIZES.xxl * 0.8,
  },

  controlIcon: {
    color: '#fff',
    fontSize: FONT_SIZES.xxl,
  },

  controlsArea: {
    // Desktop-web: playback controls stay in a centered column.
    alignSelf: 'center',
    maxWidth: APP_MAX_CONTENT_WIDTH,
    position: 'relative',
    width: '100%',
  },

  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  menuButton: {
    padding: INDENTS.low,
  },

  menuContainer: {
    position: 'relative',
  },

  menuIcon: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.lg,
  },

  progressBarContainer: {
    flex: 1,
    marginHorizontal: INDENTS.low,
  },

  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.high,
  },

  sideControl: {
    alignItems: 'center',
    padding: INDENTS.low,
    width: 50,
  },
})
