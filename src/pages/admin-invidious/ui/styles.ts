import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  addRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    marginBottom: INDENTS.medium,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: INDENTS.medium,
  },
  error: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  footer: {
    padding: INDENTS.medium,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.medium,
  },
  input: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    flex: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    gap: INDENTS.low,
    marginBottom: INDENTS.low,
    minHeight: MIN_TOUCH_TARGET,
    paddingLeft: INDENTS.medium,
  },
  rowTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    marginBottom: INDENTS.low,
  },
})
