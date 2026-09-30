import { Checkbox } from 'expo-checkbox'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { pickerStyles } from './pickerStyles'

// Строка раздела в списке выбора: чекбокс и название.
export const SectionPickerRow = ({
  isSelected,
  onToggle,
  title,
}: {
  isSelected: boolean
  onToggle: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onToggle}
      style={pickerStyles.row}
      accessibilityState={{ checked: isSelected }}
    >
      <Checkbox
        value={isSelected}
        style={pickerStyles.checkbox}
        color={isSelected ? currentTheme.primary : currentTheme.textMuted}
      />
      <View style={pickerStyles.rowBody}>
        <Text numberOfLines={1} style={[pickerStyles.rowTitle, { color: currentTheme.text }]}>
          {title}
        </Text>
      </View>
    </TouchableItem>
  )
}
