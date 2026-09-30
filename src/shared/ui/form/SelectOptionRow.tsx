import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { TouchableItem } from '../touchable-item'
import { formStyles } from './formStyles'

// Строка варианта в списке выбора: подпись и радиометка.
export const SelectOptionRow = ({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean
  label: string
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      accessibilityState={{ selected: isSelected }}
      style={[
        formStyles.selectOption,
        { borderColor: isSelected ? currentTheme.primary : 'transparent' },
      ]}
    >
      <Text style={[formStyles.selectOptionLabel, { color: currentTheme.text }]}>{label}</Text>
      {isSelected ? (
        <Ionicons size={20} name='checkmark' color={currentTheme.primary} />
      ) : (
        <View style={formStyles.selectOptionSpacer} />
      )}
    </TouchableItem>
  )
}
