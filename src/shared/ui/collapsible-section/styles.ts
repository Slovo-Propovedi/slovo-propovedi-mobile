import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'

export const styles = StyleSheet.create({
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
