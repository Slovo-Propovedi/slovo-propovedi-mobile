import { StyleSheet, TouchableOpacity } from 'react-native'
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native'
import { COLORS } from './themed'

export interface TouchableItemProps {
  children: React.ReactNode
  disabled?: boolean
  onPress: (event: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const TouchableItem = ({
  children,
  disabled = false,
  onPress,
  style,
  testID,
}: TouchableItemProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.item]

  if (disabled) buttonStyles.push({ backgroundColor: COLORS.disabled })

  buttonStyles.push(style)

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={buttonStyles}
      accessibilityRole='button'
    >
      {children}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  item: {
    width: '100%',
  },
})
