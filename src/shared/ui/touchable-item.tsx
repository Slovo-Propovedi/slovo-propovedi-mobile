import { StyleSheet } from 'react-native'
import {
  type AccessibilityState,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { COLORS } from './theme/colors'
import { TouchableButton } from './touchable-button'

export interface TouchableItemProps {
  accessibilityState?: AccessibilityState
  children: React.ReactNode
  disabled?: boolean
  noDisabledBackground?: boolean
  onPress: (event: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const TouchableItem = ({
  accessibilityState,
  children,
  disabled = false,
  noDisabledBackground = false,
  onPress,
  style,
  testID,
}: TouchableItemProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.item]

  if (disabled && !noDisabledBackground) buttonStyles.push({ backgroundColor: COLORS.disabled })

  buttonStyles.push(style)

  return (
    <TouchableButton
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={buttonStyles}
      accessibilityState={accessibilityState}
    >
      {children}
    </TouchableButton>
  )
}

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
})
