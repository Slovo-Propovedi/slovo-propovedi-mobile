import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.low,
    paddingVertical: INDENTS.lowest,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  container: {
    flex: 1,
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
  listContent: {
    padding: INDENTS.medium,
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
