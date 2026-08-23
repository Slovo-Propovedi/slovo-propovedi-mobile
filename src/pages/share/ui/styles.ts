import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 300,
    width: '100%',
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    padding: INDENTS.high,
  },
  copyButton: {
    alignSelf: 'stretch',
    marginTop: INDENTS.high,
  },
  errorText: {
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.medium,
    textAlign: 'center',
  },
  loader: {
    marginTop: INDENTS.highest,
  },
  qrCard: {
    borderRadius: RADIUSES.high,
    elevation: 2,
    marginTop: INDENTS.high,
    padding: INDENTS.medium,
    shadowColor: '#000000',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  releaseName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  releaseUrl: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },
  releaseVersion: {
    fontSize: FONT_SIZES.base,
    marginTop: INDENTS.lowest,
    textAlign: 'center',
  },
  retryButton: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    paddingVertical: INDENTS.low,
  },
})
