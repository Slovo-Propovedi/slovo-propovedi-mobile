import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    width: '100%',
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'stretch',
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
    marginVertical: INDENTS.medium,
  },
  qrCard: {
    borderRadius: RADIUSES.high,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.1)',
    elevation: 2,
    marginTop: INDENTS.high,
    padding: INDENTS.medium,
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
  releaseUrlLink: {
    textDecorationLine: 'underline',
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
  section: {
    borderRadius: RADIUSES.high,
    marginBottom: INDENTS.medium,
    overflow: 'hidden',
  },
  sectionBody: {
    alignItems: 'center',
    paddingBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: INDENTS.medium,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
})
