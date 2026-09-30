import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'

// Стили общих полей формы админки (FormField/SelectField/CheckboxField).
export const formStyles = StyleSheet.create({
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
  field: {
    marginBottom: INDENTS.medium,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: INDENTS.low,
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
})
