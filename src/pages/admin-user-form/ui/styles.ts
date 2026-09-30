import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

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
  saveButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
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
