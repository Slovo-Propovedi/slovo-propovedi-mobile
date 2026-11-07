import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: INDENTS.low,
  },
  // Fills the bottom-bar pill; the widget owns background, height and radius.
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    paddingLeft: INDENTS.medium,
    paddingRight: INDENTS.low,
  },
  input: {
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    flex: 1,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md + INDENTS.lowest,
    marginLeft: INDENTS.low,
    paddingHorizontal: INDENTS.low,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  micButton: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: INDENTS.low,
  },
  searchIcon: {
    marginRight: INDENTS.lowest,
  },
})
