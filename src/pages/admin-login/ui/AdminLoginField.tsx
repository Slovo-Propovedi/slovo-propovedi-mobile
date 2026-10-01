import { type RefObject } from 'react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Поле ввода формы входа в интерфейс администратора.
export const AdminLoginField = ({
  autoComplete,
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
        autoComplete={autoComplete}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        placeholderTextColor={currentTheme.placeholder}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
    </View>
  )
}
