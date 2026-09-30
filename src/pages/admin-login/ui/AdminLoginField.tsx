import { Text, TextInput, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Поле ввода формы входа в интерфейс администратора.
export const AdminLoginField = ({
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}: {
  label: string
  onChangeText: (value: string) => void
  placeholder: string
  secureTextEntry?: boolean
  value: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: currentTheme.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        autoCorrect={false}
        autoCapitalize='none'
        placeholder={placeholder}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={currentTheme.placeholder}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
    </View>
  )
}
