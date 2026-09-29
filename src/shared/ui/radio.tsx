import { Text, View } from 'react-native'
import { TouchableButton } from './touchable-button/TouchableButton'

export const RadioButton = (props: {
  disabled?: boolean
  label: string
  onValueChange?: (selected: boolean) => void
  selected: boolean
}) => {
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
