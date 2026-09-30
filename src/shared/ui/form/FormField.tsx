import { Text, TextInput, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { formStyles } from './formStyles'

// Текстовое поле формы с подписью и необязательной подсказкой.
export const FormField = ({
  hint,
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: {
  hint?: string
  keyboardType?: 'default' | 'email-address' | 'number-pad'
  label: string
  multiline?: boolean
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  value: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={formStyles.field}>
      <Text style={[formStyles.fieldLabel, { color: currentTheme.text }]}>{label}</Text>
      <TextInput
        value={value}
        multiline={multiline}
        placeholder={placeholder}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={currentTheme.textMuted}
        style={[
          formStyles.input,
          multiline && formStyles.inputMultiline,
          { borderColor: currentTheme.textMuted, color: currentTheme.text },
        ]}
      />
      {hint ? (
        <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  )
}
