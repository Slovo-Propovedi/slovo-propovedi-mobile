import { StyleSheet } from 'react-native'
import { COLORS } from '../theme/colors'
import { FONT_SIZES, INDENTS } from '../theme/themed'

export const styles = StyleSheet.create({
  chevron: {
    marginLeft: INDENTS.low,
  },
  container: {
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerText: {
    flex: 1,
  },
  icon: {
    marginRight: INDENTS.medium,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  title: {
    fontSize: FONT_SIZES.base,
  },
})
