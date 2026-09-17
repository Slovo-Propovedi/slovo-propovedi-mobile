import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'
import { SEARCH_HEADER_HEIGHT } from '../lib/constants'

export const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: INDENTS.medium,
  },
  clearIcon: {
    fontSize: FONT_SIZES.lg,
  },
  container: {
    borderRadius: RADIUSES.middle,
    flex: 1,
    flexDirection: 'row',
    height: SEARCH_HEADER_HEIGHT - 2 * INDENTS.low,
    marginHorizontal: INDENTS.medium,
  },
  input: {
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    flex: 1,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md + INDENTS.lowest,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
})
