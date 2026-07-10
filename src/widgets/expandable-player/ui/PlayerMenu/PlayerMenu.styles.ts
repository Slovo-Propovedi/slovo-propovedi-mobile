import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

export const styles = StyleSheet.create({
  backdrop: { bottom: -999, left: -999, position: 'absolute', right: -999, top: -999, zIndex: 1 },
  backdropPressable: { flex: 1 },
  menuContainer: {
    borderRadius: RADIUSES.middle,
    minWidth: 200,
    padding: INDENTS.low,
  },
  menuItem: { padding: INDENTS.medium },
  menuItemDisabled: { opacity: 0.5 },
  menuItemText: { fontSize: FONT_SIZES.base },
  menuItemTextDisabled: { fontSize: FONT_SIZES.base },
  menuWrapper: {
    alignSelf: 'flex-end',
    bottom: '100%',
    minWidth: 200,
    overflow: 'scroll',
    position: 'absolute',
    right: 0,
    transform: [{ translateY: 20 }],
    zIndex: 1,
  },
})
