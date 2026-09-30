import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET } from 'shared/ui/theme'

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
    paddingTop: INDENTS.high,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: INDENTS.low,
    // Reserve the icon's height up front so the header does not shift when the
    // admin shield button appears after the auth check resolves.
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.high,
  },
  headerTexts: {
    flexDirection: 'column',
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
