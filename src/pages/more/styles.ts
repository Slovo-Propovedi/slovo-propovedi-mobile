import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'

export const styles = StyleSheet.create({
  appDescription: {
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.high,
    paddingHorizontal: INDENTS.high,
  },
  appName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: INDENTS.high,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: INDENTS.low,
    paddingHorizontal: INDENTS.high,
  },
  itemContainer: {
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
  itemContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemDescription: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  itemIcon: {
    marginRight: INDENTS.medium,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZES.base,
  },
  menu: {
    flex: 1,
  },
})
