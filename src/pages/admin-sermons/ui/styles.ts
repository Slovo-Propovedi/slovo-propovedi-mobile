import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  artwork: {
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    height: 56,
    width: 56,
  },
  badge: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.low,
    paddingVertical: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginBottom: INDENTS.medium,
  },
  createButton: {
    alignSelf: 'flex-start',
    borderRadius: RADIUSES.low,
    flexGrow: 0,
    flexShrink: 0,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.medium,
    width: 'auto',
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  error: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.medium,
  },
  header: {
    paddingBottom: INDENTS.high,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    marginBottom: INDENTS.medium,
  },
  headerText: {
    flex: 1,
  },
  input: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    flex: 1,
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  listContent: {
    padding: INDENTS.medium,
  },
  loadMore: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    marginTop: INDENTS.low,
    paddingVertical: INDENTS.medium,
  },
  loadMoreText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  row: {
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  rowBody: {
    flex: 1,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  rowMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  rowTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.lowest,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
  },
})
