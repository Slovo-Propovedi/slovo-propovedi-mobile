import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { COLORS } from '../theme/colors'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { formStyles } from './formStyles'
import { RequiredAsterisk } from './RequiredAsterisk'

// Текстовое поле формы с подписью и необязательной подсказкой. Обязательное
// поле помечается красной звёздочкой; `invalid` (тронутое пустое обязательное)
// даёт красную рамку поверх состояния фокуса.
export const FormField = ({
  hint,
  invalid = false,
  keyboardType,
  label,
  multiline = false,
  onBlur,
  onChangeText,
  placeholder,
  required = false,
  secureTextEntry = false,
  value,
}: {
  hint?: string
  invalid?: boolean
  keyboardType?: 'default' | 'email-address' | 'number-pad'
  label: string
  multiline?: boolean
  onBlur?: () => void
  onChangeText: (text: string) => void
  placeholder?: string
  required?: boolean
  secureTextEntry?: boolean
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const borderStyle = invalid
    ? { borderColor: COLORS.error, borderWidth: 2 }
    : isFocused
      ? { borderColor: currentTheme.primary, borderWidth: 2 }
      : { borderColor: currentTheme.textMuted, borderWidth: 1 }

  return (
    <View style={formStyles.field}>
      <Text style={[formStyles.fieldLabel, { color: invalid ? COLORS.error : currentTheme.text }]}>
        {label}
        {required ? <RequiredAsterisk /> : null}
      </Text>
      <TextInput
        value={value}
        multiline={multiline}
        placeholder={placeholder}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        onFocus={() => setIsFocused(true)}
        placeholderTextColor={currentTheme.placeholder}
        onBlur={() => {
          setIsFocused(false)
          onBlur?.()
        }}
        style={[
          formStyles.input,
          multiline && formStyles.inputMultiline,
          { color: currentTheme.text },
          borderStyle,
        ]}
      />
      {hint ? (
        <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  )
}
