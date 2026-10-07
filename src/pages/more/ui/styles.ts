import { StyleSheet } from 'react-native'
import { SEARCH_HEADER_HEIGHT } from 'features/sermon-search'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  adminButtonSlot: {
    // Same alignment formula as Listen's adminButtonSlot: center the 48pt shield
    // on the pinned search row (SEARCH_HEADER_HEIGHT), so both screens show it at
    // the same height. `top` is relative to the SafeAreaView, so the slot is
    // independent of the header paddings. Horizontal offset uses INDENTS.medium;
    // the ±scrollbar-width gap on web is environmental and not compensated here.
    position: 'absolute',
    right: INDENTS.medium,
    top: (SEARCH_HEADER_HEIGHT - MIN_TOUCH_TARGET) / 2,
    zIndex: 2,
  },
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
    // Matches Listen's visual top spacing: its pinned search row starts at 0 but
    // the search toggle inside it adds its own INDENTS.medium padding.
    paddingTop: INDENTS.medium,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.low,
    // Match Listen's pinned search row height so the absolutely positioned shield
    // (see adminButtonSlot) lands on the same line as the title row.
    minHeight: MIN_TOUCH_TARGET,
    // Asymmetric on purpose: paddingLeft sets the title's inset, while the tighter
    // paddingRight keeps the row balanced now that the shield lives outside it.
    paddingLeft: INDENTS.medium,
    paddingRight: INDENTS.low,
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
