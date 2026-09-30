import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    marginTop: INDENTS.high,
    minHeight: 48,
    paddingHorizontal: INDENTS.high,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: INDENTS.high,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderRadius: RADIUSES.low,
    marginTop: INDENTS.medium,
    padding: INDENTS.middle,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
  field: {
    marginTop: INDENTS.medium,
  },
  input: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    fontSize: FONT_SIZES.base,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.lowest,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
})
