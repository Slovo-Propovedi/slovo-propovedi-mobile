import { Checkbox } from 'expo-checkbox'
import { Text } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Чекбокс формы с подписью; тап по всей строке переключает значение.
export const CheckboxField = ({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: boolean) => void
  value: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      style={styles.checkboxRow}
      onPress={() => onChange(!value)}
      accessibilityState={{ checked: value }}
    >
      <Checkbox
        value={value}
        style={styles.checkbox}
        color={value ? currentTheme.primary : currentTheme.textMuted}
      />
      <Text style={[styles.checkboxLabel, { color: currentTheme.text }]}>{label}</Text>
    </TouchableItem>
  )
}
