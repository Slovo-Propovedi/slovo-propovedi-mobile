import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  blockTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.medium,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  checkbox: {
    borderRadius: RADIUSES.low,
    height: 22,
    width: 22,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FONT_SIZES.base,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  container: {
    flex: 1,
  },
  errorBanner: {
    borderRadius: RADIUSES.low,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
  },
  field: {
    marginBottom: INDENTS.medium,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: INDENTS.low,
  },
  formContent: {
    padding: INDENTS.medium,
    paddingBottom: INDENTS.highest,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  input: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  playlistsBlock: {
    marginTop: INDENTS.medium,
  },
  selectModal: {
    padding: INDENTS.medium,
  },
  selectOption: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  selectOptionLabel: {
    fontSize: FONT_SIZES.base,
  },
  selectOptionSpacer: {
    width: 20,
  },
  selectTrigger: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  selectTriggerText: {
    fontSize: FONT_SIZES.base,
  },
  submit: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    marginTop: INDENTS.high,
    paddingVertical: INDENTS.medium,
  },
  submitText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
})
