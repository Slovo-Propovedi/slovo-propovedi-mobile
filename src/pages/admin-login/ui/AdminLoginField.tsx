import { Text, TextInput, type TextInputProps, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Поле ввода формы входа в интерфейс администратора.
export const AdminLoginField = ({
  autoComplete,
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  textContentType,
  value,
}: {
  autoComplete?: TextInputProps['autoComplete']
  label: string
  onChangeText: (value: string) => void
  placeholder: string
  secureTextEntry?: boolean
  textContentType?: TextInputProps['textContentType']
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
        autoComplete={autoComplete}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        placeholderTextColor={currentTheme.placeholder}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
    </View>
  )
}
