import { type RefObject } from 'react'
import { Platform, Text, TextInput, type TextInputProps, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// RN Android принимает только фиксированный набор токенов autoComplete: 'current-password'
// там отсутствует, из-за чего нативный менеджер выставляет importantForAutofill=NO и
// исключает поле из системного автозаполнения. Android-совместимый токен — 'password'.
const PASSWORD_AUTOCOMPLETE: TextInputProps['autoComplete'] =
  Platform.OS === 'android' ? 'password' : 'current-password'

// Поле ввода формы входа в интерфейс администратора.
export const AdminLoginField = ({
  autoComplete,
  importantForAutofill,
  inputRef,
  label,
  onChangeText,
  onSubmitEditing,
  placeholder,
  returnKeyType,
  secureTextEntry,
  textContentType,
  value,
}: {
  autoComplete?: TextInputProps['autoComplete']
  importantForAutofill?: TextInputProps['importantForAutofill']
  inputRef?: RefObject<null | TextInput>
  label: string
  onChangeText: (value: string) => void
  onSubmitEditing?: () => void
  placeholder: string
  returnKeyType?: TextInputProps['returnKeyType']
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
        ref={inputRef}
        autoCorrect={false}
        autoCapitalize='none'
        placeholder={placeholder}
        accessibilityLabel={label}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        importantForAutofill={importantForAutofill}
        placeholderTextColor={currentTheme.placeholder}
        autoComplete={autoComplete === 'current-password' ? PASSWORD_AUTOCOMPLETE : autoComplete}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
    </View>
  )
}
