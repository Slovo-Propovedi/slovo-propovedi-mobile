import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    paddingHorizontal: INDENTS.low,
    paddingVertical: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
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
    borderRadius: RADIUSES.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingBottom: INDENTS.high,
  },
  headerText: {
    flex: 1,
  },
  listContent: {
    padding: INDENTS.medium,
  },
  reordering: {
    paddingVertical: INDENTS.medium,
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
  rowSubtitle: {
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
