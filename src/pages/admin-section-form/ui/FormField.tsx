import { Text, TextInput, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Текстовое поле формы с подписью и необязательной подсказкой.
export const FormField = ({
  hint,
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  hint?: string
  keyboardType?: 'default' | 'number-pad'
  label: string
  multiline?: boolean
  onChangeText: (text: string) => void
  placeholder?: string
  value: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: currentTheme.text }]}>{label}</Text>
      <TextInput
        value={value}
        multiline={multiline}
        placeholder={placeholder}
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={currentTheme.textMuted}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { borderColor: currentTheme.textMuted, color: currentTheme.text },
        ]}
      />
      {hint ? <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{hint}</Text> : null}
    </View>
  )
}
