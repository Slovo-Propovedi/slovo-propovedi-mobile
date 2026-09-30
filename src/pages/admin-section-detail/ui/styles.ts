import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    gap: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  actions: {
    flexDirection: 'row',
    gap: INDENTS.low,
  },
  actionText: {
    fontSize: FONT_SIZES.base,
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
  playlistBody: {
    flex: 1,
  },
  playlistRow: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    flexDirection: 'row',
    gap: INDENTS.medium,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  playlistsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.medium,
    marginTop: INDENTS.medium,
  },
  playlistSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  playlistTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
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
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: INDENTS.lowest,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
  },
})
