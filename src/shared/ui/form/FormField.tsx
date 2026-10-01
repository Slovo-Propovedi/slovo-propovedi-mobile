import { useState } from 'react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'
import { COLORS } from '../theme/colors'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { formStyles } from './formStyles'
import { useFormSubmit } from './formSubmitContext'
import { RequiredAsterisk } from './RequiredAsterisk'

// Текстовое поле формы с подписью и необязательной подсказкой. Обязательное
// поле помечается красной звёздочкой; `invalid` (тронутое пустое обязательное)
// даёт красную рамку поверх состояния фокуса.
export const FormField = ({
  autoComplete,
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
  textContentType,
  value,
}: {
  autoComplete?: TextInputProps['autoComplete']
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
  textContentType?: TextInputProps['textContentType']
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const submitHandler = useFormSubmit()
  // Enter отправляет форму только из однострочных полей: в multiline Enter
  // обязан вставлять перенос строки.
  const canSubmitOnEnter = submitHandler !== null && !multiline

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
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        onFocus={() => setIsFocused(true)}
        placeholderTextColor={currentTheme.placeholder}
        returnKeyType={canSubmitOnEnter ? 'done' : undefined}
        onSubmitEditing={canSubmitOnEnter ? submitHandler : undefined}
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
