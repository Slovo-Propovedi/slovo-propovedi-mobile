import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  artwork: {
    borderRadius: RADIUSES.middle,
    height: 140,
    width: '100%',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  description: {
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.low,
  },
  header: {
    paddingBottom: INDENTS.medium,
  },
  listContent: {
    padding: INDENTS.medium,
  },
  sermonsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.medium,
    marginTop: INDENTS.medium,
  },
  stat: {
    borderRadius: RADIUSES.low,
    minWidth: 140,
    padding: INDENTS.medium,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.medium,
    marginTop: INDENTS.medium,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: INDENTS.lowest,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    marginTop: INDENTS.medium,
  },
})
