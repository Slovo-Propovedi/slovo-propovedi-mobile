import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from '../theme/themed'

export const styles = StyleSheet.create({
  modal: {
    padding: INDENTS.medium,
  },
  option: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  optionLabel: {
    fontSize: FONT_SIZES.base,
  },
  optionSpacer: {
    width: 20,
  },
  trigger: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  triggerText: {
    fontSize: FONT_SIZES.base,
  },
  wrapper: {
    flex: 1,
  },
})
