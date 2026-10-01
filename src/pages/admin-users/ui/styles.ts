import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: RADIUSES.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  badge: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.low,
    paddingVertical: INDENTS.lowest,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  createButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
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
    paddingBottom: INDENTS.medium,
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
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  listContent: {
    padding: INDENTS.medium,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    flexDirection: 'row',
    gap: INDENTS.medium,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  rowBody: {
    flex: 1,
  },
  rowMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  rowTitle: {
    fontSize: FONT_SIZES.md,
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
