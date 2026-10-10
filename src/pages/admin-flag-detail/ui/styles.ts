import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.middle,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  badge: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.low,
    paddingVertical: INDENTS.lowest,
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
  content: {
    padding: INDENTS.medium,
    paddingBottom: INDENTS.highest,
  },
  error: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.medium,
  },
  headerCard: {
    borderRadius: RADIUSES.middle,
    padding: INDENTS.medium,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  headerText: {
    flex: 1,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.medium,
  },
  keyText: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  retry: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    marginTop: INDENTS.low,
    paddingVertical: INDENTS.medium,
  },
  retryText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  searchInput: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginTop: INDENTS.high,
  },
  title: {
    fontSize: FONT_SIZES.h3,
    fontWeight: '700',
  },
  userBody: {
    flex: 1,
  },
  userMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  userRow: {
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
})
