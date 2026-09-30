import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    gap: INDENTS.low,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginTop: INDENTS.medium,
  },
  actionText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  avatar: {
    alignItems: 'center',
    borderRadius: RADIUSES.round,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  headerText: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.medium,
  },
  modalBody: {
    padding: INDENTS.medium,
  },
  modalCancel: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  modalConfirm: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.medium,
  },
  stat: {
    borderRadius: RADIUSES.low,
    minWidth: 150,
    padding: INDENTS.medium,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.medium,
    marginTop: INDENTS.high,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: INDENTS.lowest,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.lowest,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
  },
})
