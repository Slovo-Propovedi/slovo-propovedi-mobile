import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

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
        styles.selectOption,
        { borderColor: isSelected ? currentTheme.primary : 'transparent' },
      ]}
    >
      <Text style={[styles.selectOptionLabel, { color: currentTheme.text }]}>{label}</Text>
      {isSelected ? (
        <Ionicons size={20} name='checkmark' color={currentTheme.primary} />
      ) : (
        <View style={styles.selectOptionSpacer} />
      )}
    </TouchableItem>
  )
}
