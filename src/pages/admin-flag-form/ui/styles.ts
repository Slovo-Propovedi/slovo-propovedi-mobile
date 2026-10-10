import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  formContent: {
    padding: INDENTS.medium,
    paddingBottom: INDENTS.highest,
  },
  formGroup: {
    marginTop: INDENTS.highest,
  },
  readOnlyField: {
    marginBottom: INDENTS.medium,
  },
  readOnlyLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: INDENTS.low,
  },
  readOnlyValue: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.medium,
  },
  title: {
    fontSize: FONT_SIZES.h3,
    fontWeight: '700',
    marginBottom: INDENTS.lowest,
  },
})
