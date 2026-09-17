import { StyleSheet, Text } from 'react-native'
import { type ButtonProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { COLORS } from './theme/colors'
import { FONT_SIZES, INDENTS, RADIUSES } from './theme/themed'
import { TouchableButton } from './touchable-button'

type CustomButtonProps = { style?: StyleProp<ViewStyle>; titleStyle?: TextStyle } & ButtonProps

export const Button = ({
  color,
  disabled,
  style,
  title,
  titleStyle,
  ...rest
}: CustomButtonProps) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [styles.button]

  if (disabled) buttonStyles.push({ backgroundColor: COLORS.disabled })

  buttonStyles.push(style)

  return (
    <TouchableButton disabled={disabled} style={buttonStyles} {...rest}>
      <Text style={[styles.text, titleStyle, { color }]}>{title}</Text>
    </TouchableButton>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    padding: INDENTS.middle,
  },
  text: {
    fontSize: FONT_SIZES.h5,
    textTransform: 'uppercase',
  },
})
