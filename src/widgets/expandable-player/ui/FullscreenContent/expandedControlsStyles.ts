import { StyleSheet } from 'react-native'
import { APP_MAX_CONTENT_WIDTH } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS } from 'shared/ui/theme'

export const expandedControlsStyles = StyleSheet.create({
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  closeButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    left: INDENTS.medium,
    position: 'absolute',
    width: 48,
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
    justifyContent: 'center',
    marginBottom: INDENTS.low,
  },

  helpButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: INDENTS.medium,
    width: 48,
    zIndex: 300,
  },

  menuButton: {
    padding: INDENTS.low,
  },

  menuContainer: {
    alignItems: 'center',
    // Якорь оборачивает только ⋮: right-край совпадает с кнопкой, поэтому
    // menuWrapper right: 0 даёт точное выравнивание, а поповер открывается
    // ВВЕРХ (bottom: '100%') от второго ряда контролов.
    flexDirection: 'row',
    position: 'relative',
  },

  menuIcon: {
    // Same white as the neighboring fullscreen controls (close/transport/stop):
    // the trigger must not read as disabled against the dark player backdrop.
    color: '#fff',
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

  stopAllButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    // Left of the always-on help button (right: INDENTS.medium, width 48) so the
    // two 48×48 controls coexist while a caching run is active.
    right: INDENTS.medium + 48 + INDENTS.low,
    width: 48,
    zIndex: 300,
  },

  stopAllIcon: {
    color: '#fff',
    fontSize: FONT_SIZES.xxl,
  },
})
