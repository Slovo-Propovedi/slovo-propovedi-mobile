import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET } from 'shared/ui/theme'

// Listen's top row (SearchToggleButton: 24pt icon + INDENTS.medium padding) is
// effectively 56pt tall and centers its content at ≈28pt below the top inset.
// Padding this header by half the difference puts title and shield on that line.
const LISTEN_TOP_ROW_HEIGHT = 56
const HEADER_TOP_OFFSET = (LISTEN_TOP_ROW_HEIGHT - MIN_TOUCH_TARGET) / 2

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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.low,
    // The in-flow shield's 48pt touch target keeps the padded content box 48pt
    // tall; pairing it with paddingTop puts the title and shield centers on the
    // same ≈28pt line as Listen's 56pt top row.
    minHeight: MIN_TOUCH_TARGET,
    // paddingLeft sets the title's inset; the tighter paddingRight is the right
    // inset for the shield, which is an in-flow row sibling (no absolute slot).
    paddingLeft: INDENTS.medium,
    paddingRight: INDENTS.low,
    paddingTop: HEADER_TOP_OFFSET,
  },
  headerTexts: {
    flex: 1,
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
