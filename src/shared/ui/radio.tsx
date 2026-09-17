import { Text, View } from 'react-native'
import { TouchableButton } from './touchable-button'

type RadioButtonGroupProps = React.PropsWithChildren<object>

interface RadioButtonProps {
  disabled?: boolean
  label: string
  onValueChange?: (selected: boolean) => void
  selected: boolean
}

export const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({ children }) => (
  <View>{children}</View>
)

export const RadioButton = (props: RadioButtonProps) => {
  const { disabled, label, onValueChange, selected } = props

  const handleOnPress = () => {
    !disabled && onValueChange?.(!selected)
  }

  return (
    <TouchableButton disabled={disabled} onPress={handleOnPress}>
      <View>
        {label ? <Text>{label}</Text> : null}
        <View>{selected ? <View /> : null}</View>
      </View>
    </TouchableButton>
  )
}
