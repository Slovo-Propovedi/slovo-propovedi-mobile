import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { IconButton } from '../icon-button'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { INDENTS, RADIUSES } from '../theme/themed'
import { formStyles } from './formStyles'

const EDIT_LABEL = 'Изменить'
const EMPTY_PLACEHOLDER = 'Не задано'

// Поле ввода URL «карандаш-редактирование»: по умолчанию значение показано
// read-only текстом в рамке, справа встроена кнопка-карандаш. Тап по карандашу
// переводит поле в режим ввода; выход (blur) возвращает read-only вид и
// сохраняет значение. Пока идёт режим ввода, справа показывается галочка,
// которая тоже завершает редактирование.
export const EditableUrlField = ({
  hint,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  hint?: string
  label: string
  onChangeText: (text: string) => void
  placeholder?: string
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const borderStyle = isFocused
    ? { borderColor: currentTheme.primary, borderWidth: 2 }
    : { borderColor: currentTheme.textMuted, borderWidth: 1 }

  return (
    <View style={formStyles.field}>
      <Text style={[formStyles.fieldLabel, { color: currentTheme.text }]}>{label}</Text>
      <View style={[styles.row, borderStyle]}>
        {isEditing ? (
          <TextInput
            autoFocus
            value={value}
            placeholder={placeholder}
            accessibilityLabel={label}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            placeholderTextColor={currentTheme.placeholder}
            style={[styles.input, { color: currentTheme.text }]}
            onBlur={() => {
              setIsEditing(false)
              setIsFocused(false)
            }}
          />
        ) : (
          <Text
            numberOfLines={1}
            accessibilityLabel={label}
            style={[
              styles.readOnly,
              { color: value ? currentTheme.text : currentTheme.placeholder },
            ]}
          >
            {value || EMPTY_PLACEHOLDER}
          </Text>
        )}
        {isEditing ? (
          <IconButton
            accessibilityLabel={EDIT_LABEL}
            onPress={() => setIsEditing(false)}
            Icon={<Ionicons size={20} name='checkmark' color={currentTheme.primary} />}
          />
        ) : (
          <IconButton
            accessibilityLabel={EDIT_LABEL}
            onPress={() => setIsEditing(true)}
            Icon={<Ionicons size={20} name='pencil' color={currentTheme.primary} />}
          />
        )}
      </View>
      {hint ? (
        <Text style={[formStyles.hint, { color: currentTheme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  readOnly: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    overflow: 'hidden',
    paddingRight: INDENTS.lowest,
  },
})
