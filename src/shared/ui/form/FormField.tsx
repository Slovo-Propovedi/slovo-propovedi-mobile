import { useState } from 'react'
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
  const [isFocused, setIsFocused] = useState(false)

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
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        placeholderTextColor={currentTheme.placeholder}
        style={[
          formStyles.input,
          multiline && formStyles.inputMultiline,
          { color: currentTheme.text },
          isFocused
            ? { borderColor: currentTheme.primary, borderWidth: 2 }
            : { borderColor: currentTheme.textMuted, borderWidth: 1 },
        ]}
      />
      {hint ? (
        <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  )
}
