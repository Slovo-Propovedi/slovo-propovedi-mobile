import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  backdrop: {
    bottom: -999,
    left: -999,
    position: 'absolute',
    right: -999,
    top: -999,
    zIndex: 1,
  },
  backdropPressable: { flex: 1 },
  menuContainer: {
    borderRadius: RADIUSES.middle,
    minWidth: 200,
    padding: INDENTS.low,
  },
  menuItem: { padding: INDENTS.medium },
  menuItemDisabled: { opacity: 0.5 },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: INDENTS.medium,
  },
  menuItemText: { fontSize: FONT_SIZES.base },
  menuItemTextDisabled: { fontSize: FONT_SIZES.base },
  menuItemValue: { fontSize: FONT_SIZES.base },
  menuWrapper: {
    alignSelf: 'flex-end',
    bottom: '100%',
    minWidth: 200,
    // Clip content while the height animates open. 'hidden' (not 'scroll') —
    // on web 'scroll' forces permanent empty scrollbars on both axes.
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    transform: [{ translateY: 20 }],
    zIndex: 1,
  },
  speedCheckIcon: {
    marginLeft: INDENTS.low,
  },
  speedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: INDENTS.medium,
  },
  speedHeaderBack: {
    marginRight: INDENTS.lowest,
    padding: INDENTS.lowest,
  },
  speedHeaderText: { fontSize: FONT_SIZES.base },
})
