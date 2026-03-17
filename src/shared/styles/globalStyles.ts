import { StyleSheet } from 'react-native'
import { COLORS, SCREEN_PADDING } from '../themed'

export const globalStyles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  itemSeparator: {
    backgroundColor: COLORS.surface,
    height: 1,
    marginStart: 60,
    marginVertical: 9,
  },
  rowCenter: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowSpaceBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenPadding: {
    paddingHorizontal: SCREEN_PADDING.horizontal,
    paddingVertical: SCREEN_PADDING.vertical,
  },
})
