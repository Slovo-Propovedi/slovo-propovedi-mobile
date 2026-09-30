import { Checkbox } from 'expo-checkbox'
import { Text } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { TouchableItem } from '../touchable-item'
import { formStyles } from './formStyles'

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
      style={formStyles.checkboxRow}
      onPress={() => onChange(!value)}
      accessibilityState={{ checked: value }}
    >
      <Checkbox
        value={value}
        style={formStyles.checkbox}
        color={value ? currentTheme.primary : currentTheme.textMuted}
      />
      <Text style={[formStyles.checkboxLabel, { color: currentTheme.text }]}>{label}</Text>
    </TouchableItem>
  )
}
